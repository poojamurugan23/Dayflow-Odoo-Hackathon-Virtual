-- ============================================================================
-- Dayflow HRMS — 0004: one row per person per day in v_daily_attendance
--
-- The view as written in dayflow-build-plan.md Part 2 ends with
--
--     group by d.profile_id, d.day, h.id, lr.id, lt.is_paid, a.punch_in;
--
-- `a.punch_in` in the GROUP BY makes every punch its own group, so a day with
-- more than one punch produces MORE THAN ONE ROW, each holding only that
-- punch's hours. Two punches — which is just somebody going out for lunch —
-- turn an 8-hour day into two ~4-hour days, and the < 4 branch of the CASE then
-- scores both as half days.
--
-- Observed rather than theorised. With two punches on one date the view
-- returned 3.92h and 4.17h instead of a single 8.08h, the admin day table
-- rendered two rows for the same employee (React duplicate-key warning), and
-- v_payable_days counted the day twice in working_days.
--
-- The fix is to drop that one expression: min(punch_in), max(punch_out) and
-- sum(hours) are already aggregates and do the right thing across a whole day.
--
-- One knock-on change is required. The CASE tested `a.punch_in is null`, which
-- Postgres only permitted because punch_in was a grouping key. Without it the
-- reference must be an aggregate, so it becomes `min(a.punch_in) is null` —
-- the same question, asked of the whole day. Postgres rejects the migration
-- outright otherwise, which is how this surfaced.
--
-- Column names and types are unchanged, so v_payable_days, which selects from
-- this view, keeps working without being recreated.
-- ============================================================================

create or replace view v_daily_attendance as
with days as (
  select p.id as profile_id, p.org_id, d::date as day
  from profiles p
  cross join generate_series(
    date_trunc('month', now())::date, now()::date, interval '1 day') d
  where p.exit_date is null
)
select
  d.profile_id,
  d.day,
  min(a.punch_in)  as check_in,
  max(a.punch_out) as check_out,
  coalesce(sum(extract(epoch from (a.punch_out - a.punch_in))/3600), 0) as work_hours,
  case
    when h.id is not null                       then 'holiday'
    when extract(dow from d.day) in (0,6)       then 'weekoff'
    when lr.id is not null                      then 'leave'
    -- Was `a.punch_in is null`, which was only legal because punch_in sat in
    -- the GROUP BY. With that gone the reference has to be an aggregate;
    -- min(punch_in) is null means the day has no punches at all.
    when min(a.punch_in) is null                then 'absent'
    when coalesce(sum(extract(epoch from (a.punch_out - a.punch_in))/3600),0) < 4
                                                then 'half_day'
    else 'present'
  end as status,
  lt.is_paid as leave_is_paid
from days d
left join attendance_punches a
  on a.profile_id = d.profile_id and a.punch_in::date = d.day
left join holidays h
  on h.org_id = d.org_id and h.date = d.day
left join leave_requests lr
  on lr.profile_id = d.profile_id
 and lr.status = 'approved'
 and d.day between lr.start_date and lr.end_date
left join leave_types lt on lt.id = lr.leave_type_id
-- a.punch_in removed from here. That is the whole fix.
group by d.profile_id, d.day, h.id, lr.id, lt.is_paid;

-- security_invoker must be re-asserted: CREATE OR REPLACE VIEW resets the
-- option, and without it the view runs as its owner and bypasses RLS entirely.
alter view v_daily_attendance set (security_invoker = on);

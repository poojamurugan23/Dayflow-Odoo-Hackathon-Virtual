-- ============================================================================
-- Dayflow HRMS — 0002: RLS on the nine tables 0001 left open
--
-- Why: build-plan Part 3 enables RLS on only four tables. In Supabase, a table
-- in `public` with RLS disabled is readable by anyone holding the anon key,
-- because anon/authenticated hold table grants by default and PostgREST
-- exposes them. That left salary_structures and salary_components — every
-- salary in the company — world-readable to any signed-in employee.
--
-- Enabling RLS with no policy denies everything, so each table gets an
-- explicit policy. Writes deliberately have no policy: org setup, employee
-- creation, and audit writes all go through the service role in server
-- actions, which bypasses RLS by design.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Org reference data — any signed-in user may read.
-- ----------------------------------------------------------------------------
alter table organizations    enable row level security;
alter table work_schedules   enable row level security;
alter table holidays         enable row level security;
alter table leave_types      enable row level security;
alter table statutory_config enable row level security;

create policy "read organizations"    on organizations    for select to authenticated using (true);
create policy "read work schedules"   on work_schedules   for select to authenticated using (true);
create policy "read holidays"         on holidays         for select to authenticated using (true);
create policy "read leave types"      on leave_types      for select to authenticated using (true);
create policy "read statutory config" on statutory_config for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- Leave allocations — own balance, or all if manager.
-- ----------------------------------------------------------------------------
alter table leave_allocations enable row level security;

create policy "allocations own or manager" on leave_allocations
  for select to authenticated
  using (profile_id = auth.uid() or is_manager());

-- ----------------------------------------------------------------------------
-- Salary — admin/HR only.
-- Master plan Part 5 lists the Salary Info tab as admin-only, so that is what
-- is enforced here. To let employees see their OWN salary read-only instead
-- (the design-prompts recommendation), change the `using` clause to:
--     profile_id = auth.uid() or is_manager()
-- and keep `with check (is_manager())` so they still cannot edit it.
-- ----------------------------------------------------------------------------
alter table salary_structures enable row level security;
alter table salary_components enable row level security;

create policy "salary structures manager only" on salary_structures
  for all to authenticated
  using (is_manager())
  with check (is_manager());

create policy "salary components manager only" on salary_components
  for all to authenticated
  using (is_manager())
  with check (is_manager());

-- ----------------------------------------------------------------------------
-- Audit log — managers read; only the service role writes.
-- ----------------------------------------------------------------------------
alter table audit_log enable row level security;

create policy "audit read manager" on audit_log
  for select to authenticated using (is_manager());

-- ----------------------------------------------------------------------------
-- Harden is_manager(): pin search_path so it cannot be shadowed, and make it
-- security definer so it keeps working regardless of the caller's own grants.
-- Supabase's Security Advisor flags mutable search_path on functions.
-- ----------------------------------------------------------------------------
create or replace function is_manager() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
    where id = auth.uid() and role in ('admin','hr'));
$$;

-- ----------------------------------------------------------------------------
-- Views must respect the CALLER's RLS, not the owner's.
--
-- A Postgres view runs with the privileges of its owner by default, so the
-- three derivation views bypassed RLS on the tables underneath entirely: an
-- employee querying v_daily_attendance saw all 7 people and 154 rows, which
-- breaks "employees can view only their own attendance" (SRS 3.4.2) and the
-- master plan's "employee sees own only".
--
-- security_invoker (Postgres 15+) evaluates the underlying policies as the
-- querying user instead. Verified: employee now sees 1 person / 22 rows,
-- admin still sees 7 people / 154 rows.
-- ----------------------------------------------------------------------------
alter view v_daily_attendance set (security_invoker = on);
alter view v_leave_balance    set (security_invoker = on);
alter view v_payable_days     set (security_invoker = on);

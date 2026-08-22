-- ============================================================================
-- Dayflow HRMS — demo seed  (Odoo India)
--
-- PREREQUISITES, in order:
--   1. supabase/migrations/0001_init.sql has been run.
--   2. `npm run seed:auth` has been run — it creates the 7 auth.users rows.
--      profiles.id references auth.users, so those must exist first.
--
-- This script resolves each profile's UUID from auth.users BY EMAIL, so no
-- UUID is ever copied by hand and the two halves cannot drift apart.
--
-- Safe to re-run: it wipes all HRMS data first (auth.users is left alone).
-- All dates are relative to the current month so the derivation views —
-- which only span date_trunc('month', now()) to now() — always have data.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Clean slate. Child-first so no FK is violated.
--    Demo database only: this clears every org, not just Odoo India.
-- ---------------------------------------------------------------------------
delete from audit_log;
delete from salary_components;
delete from salary_structures;
delete from leave_requests;
delete from leave_allocations;
delete from attendance_punches;
delete from private_info;
delete from profiles;
delete from leave_types;
delete from holidays;
delete from work_schedules;
delete from statutory_config;
delete from organizations;

-- ---------------------------------------------------------------------------
-- 1. Organization
-- ---------------------------------------------------------------------------
insert into organizations (name, code, logo_url) values
  ('Odoo India', 'OI', 'https://placehold.co/128x128/1C1C21/F4F4F5?text=OI');

-- ---------------------------------------------------------------------------
-- 2. Statutory config — PF 12/12, professional tax INR 200
-- ---------------------------------------------------------------------------
insert into statutory_config (org_id, pf_employee_pct, pf_employer_pct, professional_tax)
select id, 12, 12, 200 from organizations where code = 'OI';

-- ---------------------------------------------------------------------------
-- 3. Work schedule — 5 days, 8 hrs, 60 min break, half-day under 4 hrs
-- ---------------------------------------------------------------------------
insert into work_schedules (org_id, name, days_per_week, hours_per_day, break_minutes, half_day_threshold)
select id, 'General Shift (Mon-Fri)', 5, 8, 60, 4 from organizations where code = 'OI';

-- ---------------------------------------------------------------------------
-- 4. Leave types
-- ---------------------------------------------------------------------------
insert into leave_types (org_id, name, code, is_paid, requires_attachment)
select o.id, t.name, t.code, t.is_paid, t.requires_attachment
from organizations o
cross join (values
  ('Paid Time Off', 'paid',   true,  false),
  ('Sick Leave',    'sick',   true,  true ),
  ('Unpaid Leave',  'unpaid', false, false)
) as t(name, code, is_paid, requires_attachment)
where o.code = 'OI';

-- ---------------------------------------------------------------------------
-- 5. Five holidays in the current month
--    Dates are anchored to the current month so they always land in view range.
-- ---------------------------------------------------------------------------
insert into holidays (org_id, date, name)
select o.id, (date_trunc('month', current_date) + (h.offset_days || ' days')::interval)::date, h.name
from organizations o
cross join (values
  (2,  'Raksha Bandhan'),
  (10, 'Janmashtami'),
  (14, 'Independence Day'),
  (19, 'Onam'),
  (25, 'Ganesh Chaturthi')
) as h(offset_days, name)
where o.code = 'OI';

-- ---------------------------------------------------------------------------
-- 6. Profiles — 1 admin + 6 employees
--    Login IDs follow generate_login_id(): org code + first two letters of
--    first and last name + year of joining + 4-digit serial for that year.
--    Seeded literally (deterministic); Phase 2's form calls the function.
-- ---------------------------------------------------------------------------
insert into profiles (
  id, org_id, login_id, employee_code, full_name, email, phone,
  role, job_position, department, location, date_of_joining, must_change_password
)
select
  u.id, o.id, s.login_id, s.employee_code, s.full_name, s.email, s.phone,
  s.role::user_role, s.job_position, s.department, s.location, s.doj, s.must_change
from (values
  ('priya.sharma@odooindia.example',  'OIPRSH20210001','EMP-001','Priya Sharma',   '+91 98450 11234','admin',   'HR Director',              'Human Resources','Bengaluru','2021-04-05'::date, false),
  ('arjun.nair@odooindia.example',    'OIARNA20210002','EMP-002','Arjun Nair',     '+91 98450 22345','employee','Engineering Manager',      'Engineering',    'Bengaluru','2021-07-12'::date, false),
  ('rahul.verma@odooindia.example',   'OIRAVE20220001','EMP-003','Rahul Verma',    '+91 99820 33456','employee','Senior Backend Engineer',  'Engineering',    'Pune',     '2022-01-10'::date, false),
  ('sneha.iyer@odooindia.example',    'OISNIY20220002','EMP-004','Sneha Iyer',     '+91 98860 44567','employee','Product Designer',         'Design',         'Bengaluru','2022-03-21'::date, false),
  ('vikram.singh@odooindia.example',  'OIVISI20230001','EMP-005','Vikram Singh',   '+91 97110 55678','employee','QA Engineer',              'Engineering',    'Gurugram', '2023-06-01'::date, false),
  ('meera.krishnan@odooindia.example','OIMEKR20230002','EMP-006','Meera Krishnan', '+91 98410 66789','employee','HR Executive',             'Human Resources','Chennai',  '2023-09-15'::date, false),
  ('karthik.reddy@odooindia.example', 'OIKARE20240001','EMP-007','Karthik Reddy',  '+91 99590 77890','employee','Accounts Executive',       'Finance',        'Hyderabad','2024-02-19'::date, true )
) as s(email, login_id, employee_code, full_name, phone, role, job_position, department, location, doj, must_change)
join auth.users u on lower(u.email) = s.email
cross join (select id from organizations where code = 'OI') o;

-- Fail loudly rather than seeding a half-populated company.
do $$
declare n int;
begin
  select count(*) into n from profiles;
  if n <> 7 then
    raise exception
      'Expected 7 profiles but got %. Run `npm run seed:auth` first — profiles are matched to auth.users by email.', n;
  end if;
end $$;

-- Manager relationships, set after insert to avoid self-FK ordering issues.
update profiles e set manager_id = m.id
from profiles m
where m.login_id = 'OIPRSH20210001'                      -- Priya Sharma (HR Director)
  and e.login_id in ('OIARNA20210002','OIMEKR20230002');

update profiles e set manager_id = m.id
from profiles m
where m.login_id = 'OIARNA20210002'                      -- Arjun Nair (Engineering Manager)
  and e.login_id in ('OIRAVE20220001','OISNIY20220002','OIVISI20230001');

update profiles e set manager_id = m.id
from profiles m
where m.login_id = 'OIPRSH20210001'
  and e.login_id = 'OIKARE20240001';                     -- Karthik Reddy (Finance)

-- ---------------------------------------------------------------------------
-- 7. Private info — the table one RLS policy protects as a unit
-- ---------------------------------------------------------------------------
insert into private_info (
  profile_id, dob, residing_address, nationality, personal_email, gender,
  marital_status, bank_account_no, bank_name, ifsc, pan_no, uan_no
)
select p.id, s.dob, s.address, 'Indian', s.personal_email, s.gender,
       s.marital_status, s.account_no, s.bank_name, s.ifsc, s.pan_no, s.uan_no
from (values
  ('OIPRSH20210001','1986-11-02'::date,'14, Dollars Colony, RMV Extension, Bengaluru 560094','priya.sharma86@gmail.com','Female','Married','912010037811234','HDFC Bank',    'HDFC0000123','AABCP1234K','100234567811'),
  ('OIARNA20210002','1989-05-17'::date,'22/3, Indiranagar 2nd Stage, Bengaluru 560038',      'arjun.nair89@gmail.com', 'Male',  'Married','052601509912345','ICICI Bank',   'ICIC0000526','AAKPN5678L','100234567822'),
  ('OIRAVE20220001','1993-08-24'::date,'Flat 402, Sai Residency, Baner, Pune 411045',        'rahul.verma93@gmail.com','Male',  'Single', '201000456723456','Axis Bank',    'UTIB0002010','AFZPV9012M','100234567833'),
  ('OISNIY20220002','1994-02-11'::date,'9, Kaggadasapura Main Road, Bengaluru 560093',       'sneha.iyer94@gmail.com', 'Female','Single', '384101011134567','Kotak Bank',   'KKBK0003841','AJKPI3456N','100234567844'),
  ('OIVISI20230001','1995-12-30'::date,'B-71, Sushant Lok Phase I, Gurugram 122002',         'vikram.singh95@gmail.com','Male', 'Single', '500101234545678','SBI',          'SBIN0005001','AMNPS7890P','100234567855'),
  ('OIMEKR20230002','1996-06-08'::date,'18, Besant Nagar 4th Cross, Chennai 600090',         'meera.k96@gmail.com',    'Female','Single', '600201003356789','Canara Bank',  'CNRB0006002','AQRPK1234Q','100234567866'),
  ('OIKARE20240001','1998-09-19'::date,'3-6-142, Himayatnagar, Hyderabad 500029',            'karthik.reddy98@gmail.com','Male','Single', '700301122367890','Bank of Baroda','BARB0007003','AVSPR5678R','100234567877')
) as s(login_id, dob, address, personal_email, gender, marital_status, account_no, bank_name, ifsc, pan_no, uan_no)
join profiles p on p.login_id = s.login_id;

-- ---------------------------------------------------------------------------
-- 8. Salary structures — one current structure per person, effective from joining
-- ---------------------------------------------------------------------------
insert into salary_structures (profile_id, monthly_wage, schedule_id, effective_from, created_by)
select p.id, s.wage, ws.id, p.date_of_joining, admin.id
from (values
  ('OIPRSH20210001', 90000.00),
  ('OIARNA20210002', 88000.00),
  ('OIRAVE20220001', 78000.00),
  ('OISNIY20220002', 65000.00),
  ('OIVISI20230001', 52000.00),
  ('OIMEKR20230002', 45000.00),
  ('OIKARE20240001', 40000.00)
) as s(login_id, wage)
join profiles p on p.login_id = s.login_id
cross join (select id from work_schedules limit 1) ws
cross join (select id from profiles where login_id = 'OIPRSH20210001') admin;

-- ---------------------------------------------------------------------------
-- 9. Salary components — computation rules only, never stored amounts.
--    Basic       = 50%    of monthly wage
--    HRA         = 50%    of basic
--    Standard    = 16.67% of basic
--    Bonus / LTA = 8.33%  of basic
--    Fixed       = remainder, so components always total exactly the wage
--                 (master plan Part 2: use the remainder rule, not 11.67%)
-- ---------------------------------------------------------------------------
insert into salary_components (structure_id, name, computation_type, value, sort_order)
select ss.id, c.name, c.computation_type, c.value, c.sort_order
from salary_structures ss
cross join (values
  ('Basic Salary',            'pct_of_wage',  50.0000, 1),
  ('House Rent Allowance',    'pct_of_basic', 50.0000, 2),
  ('Standard Allowance',      'pct_of_basic', 16.6700, 3),
  ('Performance Bonus',       'pct_of_basic',  8.3300, 4),
  ('Leave Travel Allowance',  'pct_of_basic',  8.3300, 5),
  ('Fixed Allowance',         'remainder',        null, 6)
) as c(name, computation_type, value, sort_order);

-- ---------------------------------------------------------------------------
-- 10. Leave allocations for the current year — 24 Paid, 7 Sick per person
-- ---------------------------------------------------------------------------
insert into leave_allocations (profile_id, leave_type_id, year, allocated_days)
select p.id, lt.id, extract(year from current_date)::int,
       case lt.code when 'paid' then 24 when 'sick' then 7 end
from profiles p
join leave_types lt on lt.code in ('paid', 'sick');

-- ---------------------------------------------------------------------------
-- 11. Leave requests — a small mix so the balance chips and the 'leave'
--     attendance status have something to show, plus one unpaid day so
--     v_payable_days is not a flat number.
-- ---------------------------------------------------------------------------
insert into leave_requests (
  profile_id, leave_type_id, start_date, end_date, days, reason,
  status, decided_by, decided_at, decision_comment
)
select
  p.id, lt.id,
  (date_trunc('month', current_date) + (r.start_offset || ' days')::interval)::date,
  (date_trunc('month', current_date) + (r.end_offset   || ' days')::interval)::date,
  r.days, r.reason, r.status::leave_status,
  case when r.status = 'approved' then admin.id end,
  case when r.status = 'approved' then now() - interval '5 days' end,
  r.comment
from (values
  ('OISNIY20220002','paid',    5, 6, 2.0, 'Family function in Coimbatore.',      'approved','Approved. Enjoy!'),
  ('OIVISI20230001','sick',   12,12, 1.0, 'Viral fever, doctor advised rest.',   'approved','Get well soon.'),
  ('OIKARE20240001','unpaid', 18,18, 1.0, 'Personal errand, no balance left.',   'approved','Approved as unpaid.'),
  ('OIRAVE20220001','paid',   24,26, 3.0, 'Short trip, already booked.',          'pending', null)
) as r(login_id, leave_code, start_offset, end_offset, days, reason, status, comment)
join profiles p on p.login_id = r.login_id
join leave_types lt on lt.code = r.leave_code
cross join (select id from profiles where login_id = 'OIPRSH20210001') admin;

-- ---------------------------------------------------------------------------
-- 12. Attendance punches — the last 20 working days, all seven people.
--
--     Deliberately ONE punch per employee per day. v_daily_attendance groups
--     by a.punch_in, so a second punch on the same day splits that day into
--     two rows with half the hours each. See the note in the Phase 0 report.
--
--     Exceptions are declared explicitly, indexed by how many working days
--     back they are (rn = 1 is the most recent), so the counts are exact:
--       2 absent days, 3 half-days, 2 missing check-outs.
--     Days already covered by an approved leave get no punch at all.
-- ---------------------------------------------------------------------------
with cal as (
  select d::date as day
  from generate_series(current_date - interval '45 days', current_date, interval '1 day') as d
),
wd as (
  select c.day, row_number() over (order by c.day desc) as rn
  from cal c
  where extract(dow from c.day) not in (0, 6)
    and not exists (select 1 from holidays h where h.date = c.day)
),
spine as (
  select day, rn from wd where rn <= 20
),
emp as (
  -- Everyone, admin included: an HR director whose own month reads "absent"
  -- 12 times demos badly. Exceptions below only target the six employees.
  select p.id, p.login_id, row_number() over (order by p.login_id) as ei
  from profiles p
),
exc(login_id, rn, kind) as (
  values
    ('OIRAVE20220001', 3,  'absent'),
    ('OIVISI20230001', 9,  'absent'),
    ('OISNIY20220002', 5,  'half'),
    ('OIKARE20240001', 12, 'half'),
    ('OIMEKR20230002', 2,  'half'),
    ('OIARNA20210002', 1,  'missing_out'),
    ('OIRAVE20220001', 8,  'missing_out')
)
insert into attendance_punches (profile_id, punch_in, punch_out, source, note)
select
  e.id,
  case
    when x.kind = 'half' then (s.day + time '09:20')
    else (s.day + time '09:00' + (interval '1 minute' * ((e.ei * 7 + s.rn * 13) % 26)))
  end,
  case
    when x.kind = 'missing_out' then null
    when x.kind = 'half'        then (s.day + time '12:50')
    else (s.day + time '18:00' + (interval '1 minute' * ((e.ei * 11 + s.rn * 7) % 41)))
  end,
  case when e.ei % 3 = 0 then 'mobile' else 'web' end,
  case when x.kind = 'missing_out' then 'Forgot to check out - needs regularization' end
from spine s
cross join emp e
left join exc x on x.login_id = e.login_id and x.rn = s.rn
where coalesce(x.kind, '') <> 'absent'
  and not exists (
    select 1 from leave_requests lr
    where lr.profile_id = e.id
      and lr.status = 'approved'
      and s.day between lr.start_date and lr.end_date
  );

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
select 'organizations' as table_name, count(*) from organizations
union all select 'profiles',           count(*) from profiles
union all select 'private_info',       count(*) from private_info
union all select 'work_schedules',     count(*) from work_schedules
union all select 'holidays',           count(*) from holidays
union all select 'leave_types',        count(*) from leave_types
union all select 'leave_allocations',  count(*) from leave_allocations
union all select 'leave_requests',     count(*) from leave_requests
union all select 'salary_structures',  count(*) from salary_structures
union all select 'salary_components',  count(*) from salary_components
union all select 'statutory_config',   count(*) from statutory_config
union all select 'attendance_punches', count(*) from attendance_punches
order by table_name;

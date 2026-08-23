# Dayflow HRMS — Build Plan

Stack: Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage) · Tailwind
+ shadcn/ui restyled with the Muster tokens · deployed on Vercel.

---

## 1. Schema DDL

Run this as one migration in the Supabase SQL editor. It is written to be
pasteable in a single go.

```sql
create extension if not exists "pgcrypto";

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null,                 -- 'OI' for Odoo India
  logo_url   text,
  created_at timestamptz default now()
);

create type user_role as enum ('admin','hr','employee');

create table profiles (
  id                   uuid primary key references auth.users on delete cascade,
  org_id               uuid not null references organizations,
  login_id             text unique not null, -- OIJODO20220001
  employee_code        text,
  full_name            text not null,
  email                text not null,
  phone                text,
  role                 user_role not null default 'employee',
  job_position         text,
  department           text,
  manager_id           uuid references profiles,
  location             text,
  avatar_url           text,
  date_of_joining      date not null,
  exit_date            date,
  must_change_password boolean default true,
  created_at           timestamptz default now()
);

create table private_info (
  profile_id      uuid primary key references profiles on delete cascade,
  dob             date,
  residing_address text,
  nationality     text,
  personal_email  text,
  gender          text,
  marital_status  text,
  bank_account_no text,
  bank_name       text,
  ifsc            text,
  pan_no          text,
  uan_no          text
);

create table work_schedules (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations,
  name               text not null,
  days_per_week      int  not null default 5,
  hours_per_day      numeric(4,2) not null default 8,
  break_minutes      int  not null default 60,
  half_day_threshold numeric(4,2) not null default 4
);

create table holidays (
  id     uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations,
  date   date not null,
  name   text not null,
  unique (org_id, date)
);

create table attendance_punches (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles on delete cascade,
  punch_in       timestamptz not null,
  punch_out      timestamptz,
  source         text not null default 'web',  -- web | mobile | qr
  is_regularized boolean default false,
  note           text
);
create index on attendance_punches (profile_id, punch_in);

create table leave_types (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations,
  name                text not null,
  code                text not null,          -- paid | sick | unpaid
  is_paid             boolean not null default true,
  requires_attachment boolean not null default false
);

create table leave_allocations (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles on delete cascade,
  leave_type_id  uuid not null references leave_types,
  year           int not null,
  allocated_days numeric(5,2) not null default 0,
  unique (profile_id, leave_type_id, year)
);

create type leave_status as enum ('pending','approved','rejected','cancelled');

create table leave_requests (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles on delete cascade,
  leave_type_id    uuid not null references leave_types,
  start_date       date not null,
  end_date         date not null,
  days             numeric(5,2) not null,
  reason           text,
  attachment_url   text,
  status           leave_status not null default 'pending',
  decided_by       uuid references profiles,
  decided_at       timestamptz,
  decision_comment text,
  created_at       timestamptz default now(),
  check (end_date >= start_date)
);
create index on leave_requests (profile_id, status);

create table salary_structures (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles on delete cascade,
  monthly_wage   numeric(12,2) not null,
  schedule_id    uuid references work_schedules,
  effective_from date not null,
  effective_to   date,
  created_by     uuid references profiles,
  created_at     timestamptz default now()
);

create table salary_components (
  id               uuid primary key default gen_random_uuid(),
  structure_id     uuid not null references salary_structures on delete cascade,
  name             text not null,
  computation_type text not null,   -- pct_of_wage | pct_of_basic | fixed | remainder
  value            numeric(8,4),
  sort_order       int default 0
);

create table statutory_config (
  org_id            uuid primary key references organizations,
  pf_employee_pct   numeric(5,2) default 12,
  pf_employer_pct   numeric(5,2) default 12,
  professional_tax  numeric(10,2) default 200
);

create table audit_log (
  id         bigserial primary key,
  org_id     uuid references organizations,
  actor_id   uuid references profiles,
  entity     text not null,
  entity_id  uuid,
  action     text not null,
  before     jsonb,
  after      jsonb,
  created_at timestamptz default now()
);
```

### Login ID generation

```sql
create or replace function generate_login_id(p_org uuid, p_name text, p_join date)
returns text language plpgsql as $$
declare v_code text; v_initials text; v_serial int;
begin
  select code into v_code from organizations where id = p_org;
  v_initials := upper(
    substr(split_part(p_name,' ',1),1,2) ||
    substr(split_part(p_name,' ',2),1,2));
  select count(*)+1 into v_serial from profiles
    where org_id = p_org and extract(year from date_of_joining) = extract(year from p_join);
  return v_code || v_initials || extract(year from p_join)::text
         || lpad(v_serial::text, 4, '0');
end $$;
```

---

## 2. The derivation views

These are the heart of the system. Build them early — every screen reads from
them.

```sql
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
    when a.punch_in is null                     then 'absent'
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
group by d.profile_id, d.day, h.id, lr.id, lt.is_paid, a.punch_in;

create or replace view v_leave_balance as
select
  al.profile_id,
  al.leave_type_id,
  lt.name as leave_type,
  al.allocated_days,
  coalesce(sum(lr.days) filter (where lr.status = 'approved'), 0) as used_days,
  al.allocated_days
    - coalesce(sum(lr.days) filter (where lr.status = 'approved'), 0) as available_days
from leave_allocations al
join leave_types lt on lt.id = al.leave_type_id
left join leave_requests lr
  on lr.profile_id = al.profile_id and lr.leave_type_id = al.leave_type_id
group by al.id, al.profile_id, al.leave_type_id, lt.name, al.allocated_days;

create or replace view v_payable_days as
select
  profile_id,
  count(*) filter (where status not in ('weekoff','holiday')) as working_days,
  count(*) filter (where status = 'absent')                    as absent_days,
  count(*) filter (where status = 'leave' and leave_is_paid is false) as unpaid_days,
  count(*) filter (where status not in ('weekoff','holiday'))
    - count(*) filter (where status = 'absent')
    - count(*) filter (where status = 'leave' and leave_is_paid is false)
    - 0.5 * count(*) filter (where status = 'half_day')        as payable_days
from v_daily_attendance
group by profile_id;
```

---

## 3. RLS policies

Turn RLS on for every table. These four policies replace hundreds of lines of
authorization code.

```sql
alter table profiles      enable row level security;
alter table private_info  enable row level security;
alter table attendance_punches enable row level security;
alter table leave_requests     enable row level security;

create or replace function is_manager() returns boolean language sql stable as $$
  select exists (select 1 from profiles
    where id = auth.uid() and role in ('admin','hr'));
$$;

create policy "read own or manage all" on profiles
  for select using (id = auth.uid() or is_manager());

create policy "private is owner or manager" on private_info
  for all using (profile_id = auth.uid() or is_manager());

create policy "punch own, read all if manager" on attendance_punches
  for all using (profile_id = auth.uid() or is_manager())
  with check (profile_id = auth.uid());

create policy "leave own, decide if manager" on leave_requests
  for select using (profile_id = auth.uid() or is_manager());
create policy "leave insert own" on leave_requests
  for insert with check (profile_id = auth.uid());
create policy "leave decide" on leave_requests
  for update using (is_manager());
```

Note the split on `leave_requests`: an employee can insert their own request but
cannot update one, so nobody can approve their own leave. That is the whole
approval-integrity story, in two policies.

---

## 4. User flows

### Company onboarding (once)
Sign up with company name, logo, admin name, email, phone → org row created,
admin profile created with `role = admin` and a generated login ID → lands on
an empty employee grid with a single "Add your first employee" invitation.

### Employee creation (HR)
`NEW` on employee grid → form: name, email, job position, department, manager,
location, joining date, monthly wage → server action calls
`generate_login_id()`, creates the auth user with a random temporary password
via the service role, inserts `profiles` + `private_info` + a default
`salary_structure` → returns the login ID and temp password on screen for HR to
hand over.

### Employee first login
Enter login ID or email + temp password → server resolves login ID to email →
sign in → `must_change_password` is true → forced password change screen →
land on employee grid.

### Daily check-in
Any screen → systray shows `Check in` → click inserts a punch with `punch_in =
now()` → timer starts, own status dot turns magenta → `Check out` sets
`punch_out` → dot turns green, the day appears in the attendance view as
`present`.

### Leave request
Time Off → `NEW` → modal: type, date range, reason, attachment if sick →
client shows live balance after this request and a team-conflict warning →
submit inserts `pending` → if the auto-approve rule matches, status flips to
`approved` immediately.

### Leave approval (HR)
Time Off → pending queue → approve or reject with comment → row updates,
`decided_by` and `decided_at` stamped → the attendance view for those dates
changes to `leave` on its next read, with no extra write.

---

## 5. The five-hour plan

Assumes 2–3 people. Solo notes at the end.

### Phase 0 — 0:00 to 0:25 · Foundation and first deploy
- `create-next-app`, Tailwind, shadcn/ui init
- Supabase project, paste the full DDL migration above
- Seed: one org, one admin, six employees, three leave types, allocations,
  20 days of backdated punches, five holidays
- Push to GitHub, connect Vercel, **deploy the empty app now**
- Set env vars in Vercel, confirm the deployed URL loads

Do not skip the deploy. Everything after this is a push away from being live.

### Phase 1 — 0:25 to 1:05 · Auth and RBAC
- Sign in page accepting login ID or email
- Company sign up page
- Forced password change on `must_change_password`
- Middleware guarding routes, RLS policies applied
- Top nav shell with avatar dropdown

Checkpoint: an employee and an admin can both log in and see different nav.

### Phase 2 — 1:05 to 1:50 · Employees
- Card grid with status dot driven by `v_daily_attendance`
- `NEW` employee form with login ID generation
- Employee profile page, Resume and Private Info tabs
- Read-only mode for non-admins

Checkpoint: HR creates an employee, that employee logs in.

### Phase 3 — 1:50 to 2:45 · Attendance
- Check in / check out systray with live timer
- Admin day view, employee month view
- Summary tiles from `v_daily_attendance`
- **Innovation 1: regularize** — a missing check-out shows an inline action
  that files a correction for approval. ~15 min, and it's the gap nobody else
  will have covered.

Checkpoint: punch in, refresh, see the row and the running timer.

### Phase 4 — 2:45 to 3:40 · Time off
- Balance chips from `v_leave_balance`
- Request modal with attachment upload to Storage
- Approve / reject queue for HR
- **Innovation 2: conflict warning** — one query on submit showing how many
  teammates are already off in that range. ~15 min.
- **Innovation 3: auto-approve** — sick leave of one day or less with balance
  available approves instantly and notifies the manager. ~10 min.

Checkpoint: employee requests, HR approves, attendance for those dates flips
to `leave` with no extra code.

### Phase 5 — 3:40 to 4:20 · Salary
- Salary Info tab, admin only
- Component auto-computation from monthly wage, live recalculation
- PF and professional tax panel
- **Innovation 4: payable days preview** — a strip on the salary tab reading
  "21 of 22 days payable · 1 unpaid leave", sourced from `v_payable_days`.
  ~15 min, and it is the moment the demo audience sees all four modules
  connect.

Checkpoint: change the wage, watch every component update and stay balanced.

### Phase 6 — 4:20 to 4:45 · Polish
- Muster palette and Schibsted + Plex Mono applied
- Empty states, loading skeletons
- Mobile responsive pass on check-in and time off
- Reseed clean demo data

### Phase 7 — 4:45 to 5:00 · Ship and rehearse
- Final deploy, smoke test on the live URL on a phone
- Write down two demo logins on a card
- Rehearse the 3-minute demo once, out loud

### Demo script (3 minutes)
1. Log in as employee. Check in — timer runs, dot goes magenta. (20s)
2. Request one day of sick leave. Conflict warning appears. Auto-approved
   instantly. (30s)
3. Open attendance — that date already reads "leave". Nothing was written
   twice. (20s)
4. Log in as HR. Employee grid shows live status for everyone. (20s)
5. Open that employee's salary tab. Payable days already reflects the leave.
   Change the wage — components recompute live. (40s)
6. Close on the architecture point: attendance is derived, not stored, so the
   modules cannot disagree. (30s)

### Solo adjustments
Cut Phase 2's employee creation form — seed employees directly and demo the
login ID format from the seed data. Cut Innovation 1 (regularize). Everything
else holds.

---

## 6. Explicitly cut

Named here so you can say "out of scope, here's why" rather than "we didn't
get to it":

| Cut | Why |
|---|---|
| Payslip PDF generation | 45+ min for a rendering pipeline; the payable-days strip proves the logic without it |
| QR / geofenced check-in | Needs a kiosk screen and device permissions |
| Email notifications | SMTP setup and deliverability eat an hour |
| Attendance anomaly detection | Needs weeks of real data to be anything but a demo of random numbers |
| Policy chatbot | Needs a document corpus that doesn't exist yet |
| Attrition scoring, pay equity | Ethically load-bearing; shipping these untested is worse than not shipping them |
| Offboarding | Real gap, but nothing in the demo path touches it |
| Multi-tenancy beyond one org | Schema supports it; the UI won't exercise it |

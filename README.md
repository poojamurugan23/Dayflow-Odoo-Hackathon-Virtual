<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=502D55&height=250&section=header&text=DayFlow%20HRMS&fontSize=80&fontColor=ffffff&animation=twinkling&fontAlignY=35&desc=The%20Future%20of%20Work%20is%20Here&descAlignY=55&descAlign=50" alt="DayFlow Header" />
  
  <br />
  
  <a href="https://github.com/poojamurugan23/Dayflow-Odoo-Hackathon-Virtual">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&duration=4000&pause=1000&color=935073&center=true&vCenter=true&width=800&lines=🚀+Seamless+Employee+Onboarding;⏱️+Real-Time+Attendance+Tracking;💰+Automated+Salary+Calculations;🗓️+Smart+Time-Off+Management;🏆+Built+for+Odoo+Hackathon+Virtual+2026" alt="Typing SVG" />
  </a>

  <br />

  <!-- Animated Badges -->
  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/Odoo-714B67?style=for-the-badge&logo=odoo&logoColor=white" />
  </p>
  
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4520-a447-11eb-908a-139a6edaec5c.gif" width="100%" />
</div>

<br/>

## 🌟 About DayFlow
**DayFlow** is a next-generation **Human Resource Management System (HRMS)** built to transform how companies manage their workforce. Developed as a flagship project for the **Odoo Hackathon - Virtual**, DayFlow bridges the gap between complex ERP systems and beautiful, intuitive user experiences. 

Say goodbye to manual salary spreadsheets and clunky attendance portals. **DayFlow automates everything.**

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4520-a447-11eb-908a-139a6edaec5c.gif" width="100%" />

## 🔥 Showstopping Features

### 👔 For Administrators (The Command Center)
> **DayFlow gives HR managers superpowers.**

- 📊 **Real-Time Live Directory:** See exactly who is Present (🟢), Absent (⚪), or On Leave (✈️) instantly. No page refreshes needed.
- ⚡ **Instant Salary Automation:** Add an employee and input their Monthly Wage. DayFlow's intelligent engine **automatically calculates** Basic (50%), HRA (50%), LTA (8.33%), Performance Bonuses, PF (12%), and Tax deductions instantly in a beautiful preview panel.
- 📝 **Frictionless Time-Off Workflow:** Approve or reject leave requests with comments in a single click.
- 🔐 **Secure Role-Based Access:** Protected tabs for Resumes, Salary Info, and Private details—only visible to authorized admins.

### 👨‍💻 For Employees (The Workspace)
> **A workspace employees will actually love using.**

- ⏱️ **Live Attendance Systray:** Employees Check-In and Check-Out with a live, ticking `HH:MM:SS` timer that floats on their dashboard.
- 📅 **Interactive Leave Calendar:** A stunning 12-month visual calendar showing pending balances and time-off history.
- 🎨 **Premium UI/UX:** A gorgeous Purple (#502D55) & Crisp White/Grey design system with glassmorphism, smooth micro-animations, and hover effects.
- 🔍 **Universal Tabbed Profiles:** A unified, stunning profile view across the entire app for directories and admin views.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4520-a447-11eb-908a-139a6edaec5c.gif" width="100%" />

## 💻 Visual Preview

<div align="center">
  <img src="https://cdn.dribbble.com/users/2064121/screenshots/18257313/media/41e4c798e26bc4bf8f700057208152f8.gif" alt="HR Dashboard Animation" width="850" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
  <p><em>(Conceptual representation of DayFlow's smooth, animated interface)</em></p>
</div>

<br/>

---

# Dayflow ΓÇö Human Resource Management System

> Every workday, perfectly aligned.

Identity, presence, absence, and compensation as **one** record. Attendance and
approved leave *feed* payroll rather than sitting beside it ΓÇö that connection is
the product thesis, not a bonus feature.

**Status: complete.** Auth, employees, attendance, time off, salary, and the
brand pass. See *Known limitations* for what is deliberately out of scope.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript, strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database / Auth / Storage | Supabase (Postgres with RLS) |
| Supabase adapter | `@supabase/ssr` |
| Deploy | Vercel |

Authorization lives in Postgres RLS policies, not in application `if`
statements. Attendance status is **derived by a view**, never stored ΓÇö so leave
approval and attendance cannot disagree.

---

## Environment variables

Get all three from **Supabase Dashboard ΓåÆ Project Settings ΓåÆ API**.

| Variable | Where it goes | Exposed to browser? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` **and** Vercel | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` **and** Vercel | Yes | Safe: every query it makes is still filtered by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` **and** Vercel | **No ΓÇö server only** | See the warning below |

> ### ΓÜá `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS completely
>
> This key ignores every row-level security policy. Anyone holding it can read
> every salary, PAN number, and bank account in the database.
>
> - **Never** prefix it with `NEXT_PUBLIC_`. That would ship it to the browser.
> - **Never** import it into a Client Component or any file with `"use client"`.
> - It is used only by `scripts/create-auth-users.mjs` and, from Phase 2, by the
>   server action that creates employees.
> - `.env.local` is gitignored. Keep it that way. `.env.example` is the
>   committed template and holds no values.

Anything named `NEXT_PUBLIC_*` is inlined into the client bundle at build time.
That is fine for the URL and anon key, and fatal for the service role key.

---

## Setup

```bash
npm install
cp .env.example .env.local      # then fill in the three values
```

### 1. Run the migration

Supabase Dashboard ΓåÆ **SQL Editor** ΓåÆ **New query** ΓåÆ paste all of
`supabase/migrations/0001_init.sql` ΓåÆ **Run**.

Creates 13 tables, 2 enums, `generate_login_id()`, the three derivation views,
and enables RLS with 6 policies.

Then paste `supabase/migrations/0002_rls_remaining_tables.sql` and Run it too.
0001 (from the build plan) enables RLS on only 4 of the 13 tables and leaves
the derivation views running as their owner, which left every salary readable
by any signed-in employee and made all three views ignore RLS entirely. 0002
closes both. Do not skip it.

### 2. Create the auth users

```bash
npm run seed:auth
```

`profiles.id` references `auth.users`, so the auth rows must exist before the
seed can insert profiles. This uses the Supabase admin API, which is the only
reliable way to produce users that can actually log in.

### 3. Run the seed

Supabase SQL Editor ΓåÆ paste all of `supabase/seed.sql` ΓåÆ **Run**.

It matches profiles to auth users **by email**, so no UUID is ever copied by
hand. Safe to re-run; it wipes HRMS data first and leaves `auth.users` alone.

### 4. Develop

```bash
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```

---

## Demo logins

All seeded users share the password **`Dayflow@2026`**.
Sign-in accepts either the login ID or the email (Phase 1).

| Login ID | Name | Role | Email |
|---|---|---|---|
| `OIPRSH20210001` | Priya Sharma | **admin** | priya.sharma@odooindia.example |
| `OIARNA20210002` | Arjun Nair | employee | arjun.nair@odooindia.example |
| `OIRAVE20220001` | Rahul Verma | employee | rahul.verma@odooindia.example |
| `OISNIY20220002` | Sneha Iyer | employee | sneha.iyer@odooindia.example |
| `OIVISI20230001` | Vikram Singh | employee | vikram.singh@odooindia.example |
| `OIMEKR20230002` | Meera Krishnan | employee | meera.krishnan@odooindia.example |
| `OIKARE20240001` | Karthik Reddy | employee | karthik.reddy@odooindia.example |

Karthik Reddy is seeded with `must_change_password = true` so Phase 1's forced
password-change screen has a test subject.

**Login ID format** ΓÇö `OIPRSH20210001` = org code `OI` + first two letters of
first and last name + year of joining + 4-digit serial for that year.

---

## Keepalive

Supabase's free tier pauses after ~7 days of inactivity, so a judge opening the
link on day 9 would get a dead app. `.github/workflows/keepalive.yml` pings the
REST API daily at 06:00 UTC.

It needs two **GitHub** repository secrets (Settings ΓåÆ Secrets and variables ΓåÆ
Actions): `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Note these names have no
`NEXT_PUBLIC_` prefix ΓÇö they are GitHub secrets, not Vercel env vars.

---

## Layout

```
app/
  (auth)/sign-in ┬╖ sign-up ┬╖ change-password      Phase 1
  (app)/employees ┬╖ attendance ┬╖ time-off         Phases 2-4
  api/upload                                      Phase 2
lib/supabase/server.ts ┬╖ client.ts                @supabase/ssr clients
lib/salary.ts ┬╖ attendance.ts                     Phases 5 ┬╖ 3
actions/                                          server actions
components/ui/                                    shadcn, restyled
supabase/migrations/0001_init.sql ┬╖ seed.sql
scripts/create-auth-users.mjs
```

Empty directories are placeholders from the master plan's Appendix B so later
phases have a home.
   which would let anyone read every salary in the company. Replaced with
   admin-invite onboarding.
2. **Fixed Allowance is the remainder.** The wireframe shows Γé╣2,918 (11.67%),
   but `wage ΓêÆ sum(components)` = Γé╣4,168. The remainder rule is used so the
   validation strip balances at Γé╣50,000 / Γé╣50,000.


---

## Migrations

Run in order, in the Supabase SQL editor:

| File | What it does |
|---|---|
| `0001_init.sql` | Schema, `generate_login_id()`, the three derivation views, first RLS policies. Verbatim from the build plan. |
| `0002_rls_remaining_tables.sql` | RLS on the nine tables 0001 left open ΓÇö salary was world-readable to any signed-in employee ΓÇö and `security_invoker` on the views, without which they bypassed RLS entirely. |
| `0003_resume_fields_and_bank_lockdown.sql` | Resume columns; column-level grants so an employee cannot change their own bank details through the API. |
| `0004_fix_daily_attendance_grouping.sql` | Drops `a.punch_in` from `v_daily_attendance`'s GROUP BY, so a lunch break stops splitting one day into two half-days. |
| `0005_notifications_and_leave_integrity.sql` | `notifications` table; closes three ways an employee could grant themselves leave through the API (insert an already-approved request, understate the day count, hold overlapping requests); stops anyone ΓÇö HR included ΓÇö approving their own leave. |
| `0006_salary_visibility.sql` | Lets an employee read their own salary; keeps everyone else out, including HR. Splits 0002's `for all` policy by command ΓÇö widening it would have let an employee DELETE their own salary history. Revokes every write grant so the only path to a wage change is the audited server action, and adds a unique index guaranteeing one open structure per person. |

Then `npm run setup:storage` for the `avatars` and `leave-documents` buckets.


---

## Known limitations

All intentional, all scoped out rather than half-built.

| Limitation | Why |
|---|---|
| **No payslip PDF** | The payable-days strip already proves attendance drives payroll; PDF generation proves nothing extra and costs a rendering dependency. |
| **No email** | Replaced by in-app notifications by design ΓÇö deliverability from a hackathon deploy is unreliable and unverifiable. Supabase still sends auth emails. |
| **Time-off calendar covers 3 months** | Current month plus two. A full year is twelve grids of mostly-empty cells; widening it is one constant in `components/time-off/leave-calendar.tsx`. |
| **Work schedules are read-only** | Changing `half_day_threshold` retroactively rescores every past day through `v_daily_attendance`. That needs effective-dating like salary has, not an in-place edit. |
| **No offboarding / exit flow** | `profiles.exit_date` exists and the views already filter on it; the UI does not. |
| **No multi-org UI** | The schema is org-scoped, but `is_manager()` is not ΓÇö with a second organisation a manager would see the other org's rows. Single-tenant demo. |
| **No QR or geofenced check-in** | `attendance_punches.source` already carries `web \| mobile \| qr`. |
| **Break time is not deducted from work hours** | It is displayed from `work_schedules` and used for the half-day threshold, but `v_daily_attendance` sums raw punch spans. |
| **No attendance analytics** | Charts and trends. The data supports them; nothing reads it that way. |
| **Attendance view performance** | `v_daily_attendance` builds its day spine with `generate_series` on every read, and only for the CURRENT month. Fine at demo scale; production would materialize nightly and widen the window. |
| **No dark theme** | The brand guidelines define one working surface (Paper with white cards). A second palette nobody specified would be invented, not applied. |
| **Offline** | The service worker gives installability and a fallback page. It deliberately caches no data responses ΓÇö every screen is per-user data behind RLS, and a cached salary would outlive the session that was allowed to see it. |

### Deliberate deviations from the wireframe

| Wireframe | What was built | Why |
|---|---|---|
| Status dot goes red ΓåÆ green on check-in | Three states: **Live magenta** while a session runs, settling to green on check-out | The brand guidelines' live-accent rule. "In the office right now" is a different fact from "was present today", and it is the one thing on screen that is happening. |
| Fixed Allowance Γé╣2,918 (11.67% of Basic) | The **remainder** ΓÇö Γé╣4,167.50 on a Γé╣50,000 wage | Master plan Part 2. The printed figure leaves the components Γé╣1,250 short of the wage, so the validation strip could never balance. |
| Standard Allowance "16.67% of wage" (Phase 6 brief) | 16.67% **of Basic** | Of-wage makes the five named components total exactly the wage and Fixed Allowance zero, contradicting the Γé╣4,168 both documents state. The wireframe's own Fixed figure confirms the base. |
| Self-registration with a role picker | Admin-invite onboarding only | A public role picker lets anyone self-assign HR and read every salary. |
| Employee edits limited to address/phone/picture (SRS 3.3.2) | Employees may also edit their own r├⌐sum├⌐ prose and skills | A bio written by HR on someone's behalf is not a feature. Bank and job details stay HR-only. |


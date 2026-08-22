# Dayflow — Human Resource Management System

> Every workday, perfectly aligned.

Identity, presence, absence, and compensation as **one** record. Attendance and
approved leave *feed* payroll rather than sitting beside it — that connection is
the product thesis, not a bonus feature.

**Status: Phase 0 complete.** Foundation, schema, seed, and first deploy. No
feature UI yet.

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
statements. Attendance status is **derived by a view**, never stored — so leave
approval and attendance cannot disagree.

---

## Environment variables

Get all three from **Supabase Dashboard → Project Settings → API**.

| Variable | Where it goes | Exposed to browser? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` **and** Vercel | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` **and** Vercel | Yes | Safe: every query it makes is still filtered by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` **and** Vercel | **No — server only** | See the warning below |

> ### ⚠ `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS completely
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

Supabase Dashboard → **SQL Editor** → **New query** → paste all of
`supabase/migrations/0001_init.sql` → **Run**.

Creates 13 tables, 2 enums, `generate_login_id()`, the three derivation views,
and enables RLS with 6 policies.

### 2. Create the auth users

```bash
npm run seed:auth
```

`profiles.id` references `auth.users`, so the auth rows must exist before the
seed can insert profiles. This uses the Supabase admin API, which is the only
reliable way to produce users that can actually log in.

### 3. Run the seed

Supabase SQL Editor → paste all of `supabase/seed.sql` → **Run**.

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

**Login ID format** — `OIPRSH20210001` = org code `OI` + first two letters of
first and last name + year of joining + 4-digit serial for that year.

---

## Keepalive

Supabase's free tier pauses after ~7 days of inactivity, so a judge opening the
link on day 9 would get a dead app. `.github/workflows/keepalive.yml` pings the
REST API daily at 06:00 UTC.

It needs two **GitHub** repository secrets (Settings → Secrets and variables →
Actions): `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Note these names have no
`NEXT_PUBLIC_` prefix — they are GitHub secrets, not Vercel env vars.

---

## Layout

```
app/
  (auth)/sign-in · sign-up · change-password      Phase 1
  (app)/employees · attendance · time-off         Phases 2-4
  api/upload                                      Phase 2
lib/supabase/server.ts · client.ts                @supabase/ssr clients
lib/salary.ts · attendance.ts                     Phases 5 · 3
actions/                                          server actions
components/ui/                                    shadcn, restyled
supabase/migrations/0001_init.sql · seed.sql
scripts/create-auth-users.mjs
```

Empty directories are placeholders from the master plan's Appendix B so later
phases have a home.

---

## Reference documents

- `dayflow-build-plan.md` — the authoritative SQL (Parts 1–3)
- `dayflow-claude-design-prompts.md` — screen-by-screen design intent
- `Dayflow - Human Resource Management System.pdf` — original SRS

The master plan (`dayflow-master-plan.md`, kept outside this repo) supersedes
the build plan where they disagree. Two deliberate deviations from the SRS:

1. **No self-registration.** The SRS lets anyone sign up and pick the HR role,
   which would let anyone read every salary in the company. Replaced with
   admin-invite onboarding.
2. **Fixed Allowance is the remainder.** The wireframe shows ₹2,918 (11.67%),
   but `wage − sum(components)` = ₹4,168. The remainder rule is used so the
   validation strip balances at ₹50,000 / ₹50,000.

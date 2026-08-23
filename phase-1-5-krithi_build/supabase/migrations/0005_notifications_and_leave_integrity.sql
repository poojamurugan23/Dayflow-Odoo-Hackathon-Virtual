-- ============================================================================
-- Dayflow HRMS — 0005: notifications, and the leave-request integrity rules
--
-- Phase 4 needs one new table. It also has to close three holes in
-- `leave_requests` that were found by impersonating an employee against the
-- policies from 0001 and issuing the requests PostgREST would issue.
--
-- The build plan's comment says "an employee may insert their own leave request
-- but never update one, so nobody can approve their own leave". That is true of
-- UPDATE and false of INSERT. The insert policy is
--     for insert with check (profile_id = auth.uid())
-- which constrains WHOSE row it is and nothing else. Verified as an employee:
--
--   HOLE 1  insert ... status = 'approved'        -> accepted.
--           Self-approved leave. v_daily_attendance then reports those dates
--           as `leave`, which is exactly the derivation working correctly on
--           forged input.
--   HOLE 2  insert ... start+60 .. start+69, days = 0  -> accepted.
--           Ten days off costing zero balance, because v_leave_balance is
--           allocated - sum(days).
--   HOLE 3  two overlapping pending requests      -> accepted.
--           Double-counts against the balance and makes the queue ambiguous.
--
-- The fixes are deliberately at the database level. The server action in
-- actions/leave.ts checks all three as well, so the user gets a sentence rather
-- than a constraint error — but the action is not the gate, because the API is
-- reachable without it.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Notifications — the in-app centre that replaces email
--
-- No SMTP in this build, so "HR is notified" has to mean something visible.
-- Rows are written only by server actions holding the service role: a user who
-- could insert here could forge a message from HR to anyone.
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles on delete cascade,
  type       text not null,               -- leave_submitted | leave_decided | leave_auto_approved | welcome
  title      text not null,
  body       text,
  link       text,                        -- in-app destination, e.g. /time-off
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

-- The bell's query is "my unread, newest first" on every page load.
create index if not exists notifications_inbox_idx
  on notifications (profile_id, is_read, created_at desc);

alter table notifications enable row level security;

drop policy if exists "notifications read own" on notifications;
create policy "notifications read own" on notifications
  for select to authenticated
  using (profile_id = auth.uid());

-- Marking as read is the only write a user makes. There is deliberately no
-- INSERT policy: see the note above.
drop policy if exists "notifications mark own read" on notifications;
create policy "notifications mark own read" on notifications
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Same reasoning as 0003: RLS picks the rows, grants pick the columns. Without
-- the column grant, the update policy above would also let someone rewrite the
-- title and body of a notification they received.
revoke insert, update on notifications from authenticated;
grant  update (is_read) on notifications to authenticated;


-- ----------------------------------------------------------------------------
-- 2. HOLE 1 — an employee may not insert a decision
--
-- `status` defaults to 'pending', and `decided_by` / `decided_at` /
-- `decision_comment` are now simply not insertable by `authenticated`. A
-- crafted POST that includes them is rejected by Postgres, not merely ignored.
--
-- Auto-approval (Innovation 3) therefore cannot be performed by the requester's
-- own session even though the rule fires on their submit. actions/leave.ts
-- inserts the row as pending through the user's client, evaluates the rule
-- server-side, and flips it with the service role — so the approval is always
-- an act of the system rather than of the employee.
-- ----------------------------------------------------------------------------
revoke insert, update on leave_requests from authenticated;

grant insert (
  profile_id, leave_type_id, start_date, end_date, days, reason, attachment_url
) on leave_requests to authenticated;

-- Approvers change the decision and nothing else. In particular they cannot
-- move the dates or the day count of a request while approving it, so what is
-- approved is what was asked for.
grant update (
  status, decided_by, decided_at, decision_comment
) on leave_requests to authenticated;


-- ----------------------------------------------------------------------------
-- 3. HOLE 2 — the day count has to be within the range it claims
--
-- `days` is what v_leave_balance subtracts, so understating it is free leave.
-- The exact business-day figure needs the holiday calendar and belongs in the
-- application; the invariant that survives here is that a request can never
-- claim fewer than zero or more than the calendar days it actually spans.
-- A range that is entirely weekend or holiday computes to zero days and is
-- rejected by `days > 0` — the action says so in words first.
-- ----------------------------------------------------------------------------
alter table leave_requests drop constraint if exists leave_days_within_range;
alter table leave_requests add constraint leave_days_within_range
  check (days > 0 and days <= (end_date - start_date + 1));


-- ----------------------------------------------------------------------------
-- 4. HOLE 3 — one person cannot hold two live requests over the same day
--
-- An exclusion constraint rather than a uniqueness trick, because the thing
-- being excluded is an overlap of ranges. Rejected and cancelled requests are
-- outside the predicate: a rejection must not block re-applying for the same
-- dates.
--
-- 23P01 (exclusion_violation) is caught in actions/leave.ts and rendered as
-- "You already have a request covering those dates."
-- ----------------------------------------------------------------------------
create extension if not exists btree_gist;

alter table leave_requests drop constraint if exists leave_no_overlap;
alter table leave_requests add constraint leave_no_overlap
  exclude using gist (
    profile_id                              with =,
    daterange(start_date, end_date, '[]')   with &&
  ) where (status in ('pending', 'approved'));


-- ----------------------------------------------------------------------------
-- 5. Nobody approves their own leave — including HR and admins
--
-- 0001's update policy is `using (is_manager())`. An HR officer is also an
-- employee, so as written they could approve their own request. That is the one
-- rule the master plan states outright about this table, so it belongs in the
-- policy rather than in a UI branch.
--
-- Consequence worth knowing: an admin's own leave needs a second admin to
-- decide it. With a single admin in the demo org, Priya's requests stay pending
-- — which is the correct behaviour, not a bug.
-- ----------------------------------------------------------------------------
drop policy if exists "leave decide" on leave_requests;

create policy "leave decide" on leave_requests
  for update to authenticated
  using      (is_manager() and profile_id <> auth.uid())
  with check (is_manager() and profile_id <> auth.uid());


-- ----------------------------------------------------------------------------
-- 6. Sick-note storage — owner and managers only
--
-- The `leave-documents` bucket is private (created by scripts/setup-storage.mjs)
-- and every read is a short-lived signed URL minted by a server action that has
-- already authorised the caller. These policies are the second lock: they make
-- the anon/authenticated key useless against the bucket even if a signed URL
-- were generated by mistake.
--
-- Path convention, relied on by the policy: `<profile_id>/<request_id>.<ext>`,
-- so the first path segment is the owner.
--
-- Wrapped in an exception handler because storage.objects is owned by
-- supabase_storage_admin. On Supabase's SQL editor this succeeds; on a plain
-- Postgres (or a restricted role) it raises insufficient_privilege, and the
-- rest of this migration must still apply. If it is skipped, add the two
-- policies from Dashboard -> Storage -> Policies. The bucket being private
-- plus signed-URL-only reads already prevents anonymous access.
-- ----------------------------------------------------------------------------
do $$
begin
  execute $p$drop policy if exists "leave docs read own or manager" on storage.objects$p$;
  execute $p$
    create policy "leave docs read own or manager" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'leave-documents'
        and (is_manager() or (storage.foldername(name))[1] = auth.uid()::text)
      )
  $p$;

  -- Uploads go through the server action with the service role, which bypasses
  -- RLS. No INSERT policy is granted, so the direct upload path stays shut.
  raise notice 'leave-documents storage policy applied';
exception
  when insufficient_privilege then
    raise notice 'SKIPPED storage policy (need supabase_storage_admin) — add it in the dashboard';
  when invalid_schema_name or undefined_table or undefined_function then
    -- No storage schema at all: a plain Postgres, e.g. the local validation
    -- database. Everything above this block still applies.
    raise notice 'SKIPPED storage policy (no storage schema here) — expected outside Supabase';
end $$;

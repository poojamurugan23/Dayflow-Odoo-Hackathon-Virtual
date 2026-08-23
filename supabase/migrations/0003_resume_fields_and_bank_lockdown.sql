-- ============================================================================
-- Dayflow HRMS — 0003
--
-- Two gaps found while building Phase 2:
--
--   1. Bank details were writable by their owner through the API.
--      The `private_info` policy is FOR ALL USING (owner or manager), so an
--      employee holding the anon key could PATCH their own bank_account_no
--      directly via PostgREST, bypassing the app entirely. The UI already shows
--      those fields read-only with a "changes require HR" hint, but the UI is
--      not the control. Redirecting your own salary is a fraud vector, and
--      SRS 3.3.2 limits employee edits to address, phone and picture.
--
--   2. The Resume tab had nowhere to store anything.
--      SRS 3.3.1 and the wireframe call for About, What I love about my job,
--      My interests and hobbies, Skills and Certification, but no column
--      existed for any of them, so the tab could only ever show empty states.
--
-- Column-level privileges are the right tool for (1). RLS restricts WHICH ROWS
-- a caller may touch; it cannot restrict WHICH COLUMNS. Grants can.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Resume fields (SRS 3.3.1)
--
-- These live on `profiles` rather than `private_info` because they are not
-- sensitive — a bio is meant to be read. `private_info` exists so that one
-- policy protects bank account, PAN and UAN together; putting a hobby in there
-- would dilute that.
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists about          text;
alter table profiles add column if not exists job_love       text;
alter table profiles add column if not exists interests      text;
alter table profiles add column if not exists skills         text[] not null default '{}';
alter table profiles add column if not exists certifications text[] not null default '{}';


-- ----------------------------------------------------------------------------
-- 2. Lock down private_info writes from the API
--
-- `authenticated` is one role shared by employees, HR and admins, so a grant
-- cannot tell them apart. The split is therefore:
--
--   * residing_address  — the one field SRS 3.3.2 lets an employee change, so
--     `authenticated` keeps UPDATE on it. Combined with the existing RLS
--     policy, a signed-in user may change the address on their own row and
--     nothing else. That holds even if application code is wrong.
--
--   * everything else, bank details included — no UPDATE for `authenticated`
--     at all. HR still edits these, but through the server action, which
--     authorises the actor and then writes with the service role. The API path
--     is simply closed.
--
--   * INSERT is revoked too. Without this the same tampering works by inserting
--     a private_info row rather than updating one, for any employee whose row
--     is somehow missing. Rows are created when the employee is created, and
--     the server action backfills with the service role if one is ever absent.
-- ----------------------------------------------------------------------------
revoke insert, update on private_info from authenticated;
grant  update (residing_address) on private_info to authenticated;

-- SELECT is deliberately untouched: the existing policy already limits reads to
-- the owner and managers, and an employee is meant to SEE their own bank
-- details even though they may not change them.


-- ----------------------------------------------------------------------------
-- 3. Same reasoning for profiles
--
-- `profiles` has no UPDATE policy at all, so RLS already refuses every write
-- from `authenticated`. Revoking the grants as well means a future policy added
-- without thinking about columns cannot accidentally expose `role` — which is
-- the one column that turns a missed check into privilege escalation.
-- ----------------------------------------------------------------------------
revoke insert, update on profiles from authenticated;

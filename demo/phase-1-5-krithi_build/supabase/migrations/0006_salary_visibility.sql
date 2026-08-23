-- ============================================================================
-- Dayflow HRMS — 0006: who may see and change a salary
--
-- 0002 locked both salary tables to `for all using (is_manager())`. Phase 5
-- needs two changes to that, and the second one is a hole rather than a feature
-- request.
--
--   1. An employee must be able to read THEIR OWN salary. 0002 anticipated this
--      exactly — its own comment names the clause to change — because the
--      master plan resolves the wireframe ambiguity as "an employee may see
--      their own salary read-only; an admin may see and edit anyone's".
--
--   2. `for all using (...)` also governs DELETE, and a `with check` clause
--      does not apply to DELETE. So the moment (1) widens the USING clause to
--      include `profile_id = auth.uid()`, an employee can DELETE their own
--      salary structure — and with it their salary history — even though they
--      still cannot change the figures. Widening a `for all` policy is what
--      makes this a hole, so the policy has to be split by command, not edited.
--
-- Hence: an explicit SELECT policy, and NO write policy at all. Writes go
-- through actions/salary.ts with the service role, which authorises the actor
-- and always records an audit_log row. That is the same reasoning as 0003 for
-- bank details: a change to what somebody gets paid should have exactly one
-- code path, and that path should be the one that leaves a trail.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. is_admin() — narrower than is_manager()
--
-- is_manager() is admin OR hr. The master plan lists the Salary Info tab as
-- admin-only (Part 5) and the SRS agrees (3.6.2, "editable by admin"), so
-- salary uses this instead. An HR officer therefore sees their own salary and
-- nobody else's, like any other employee.
--
-- To let HR see and edit salaries too, replace is_admin() with is_manager() in
-- the policy below and in the actor check in actions/salary.ts. Both, or the
-- UI and the database will disagree.
-- ----------------------------------------------------------------------------
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
    where id = auth.uid() and role = 'admin');
$$;


-- ----------------------------------------------------------------------------
-- 2. salary_structures — read own or admin, write nowhere
-- ----------------------------------------------------------------------------
drop policy if exists "salary structures manager only" on salary_structures;
drop policy if exists "salary structures read own or admin" on salary_structures;

create policy "salary structures read own or admin" on salary_structures
  for select to authenticated
  using (profile_id = auth.uid() or is_admin());

-- Deliberately no INSERT/UPDATE/DELETE policy: RLS denies by default once
-- enabled, so the API write path is shut for employees AND admins. The grants
-- go too, so a future policy added without this reasoning in view cannot
-- silently reopen it.
revoke insert, update, delete on salary_structures from authenticated;


-- ----------------------------------------------------------------------------
-- 3. salary_components — same rule, reached through the parent structure
--
-- The components table has no profile_id; ownership lives on the structure it
-- belongs to. The EXISTS below is evaluated as the calling user, so it lands on
-- the same row set as the policy above rather than restating the rule.
-- ----------------------------------------------------------------------------
drop policy if exists "salary components manager only" on salary_components;
drop policy if exists "salary components read own or admin" on salary_components;

create policy "salary components read own or admin" on salary_components
  for select to authenticated
  using (
    exists (
      select 1 from salary_structures s
      where s.id = salary_components.structure_id
        and (s.profile_id = auth.uid() or is_admin())
    )
  );

revoke insert, update, delete on salary_components from authenticated;


-- ----------------------------------------------------------------------------
-- 4. Close the salary history that seed data and Phase 2 left open-ended
--
-- Every structure was inserted with effective_to = null, which is correct for
-- exactly one row per person: the current one. Versioning in Phase 5 depends on
-- there being only one open row to close, so any duplicates from earlier
-- testing are closed here rather than left to make `.is('effective_to', null)`
-- ambiguous later.
--
-- Ordered by effective_from then created_at, so the newest stays open.
-- ----------------------------------------------------------------------------
-- Note the two DIFFERENT window orderings, which is the whole trick here:
--   rn        ranks newest-first, so rn > 1 means "not the current structure".
--   next_from walks ASCENDING, so it is the start of the structure that
--             SUPERSEDED this one — which is what the range must end just before.
-- Using lead() over the descending order instead returns the older neighbour and
-- closes every range on its own start date, producing a row that ends the day it
-- begins. That is wrong in a way the data does not obviously show.
with ranked as (
  select id,
         row_number() over (
           partition by profile_id
           order by effective_from desc, created_at desc
         ) as rn,
         lead(effective_from) over (
           partition by profile_id
           order by effective_from asc, created_at asc
         ) as next_from
  from salary_structures
  where effective_to is null
)
update salary_structures s
set effective_to = greatest(s.effective_from, r.next_from - 1)
from ranked r
where s.id = r.id and r.rn > 1 and r.next_from is not null;


-- ----------------------------------------------------------------------------
-- 5. One open structure per person, from now on
--
-- Makes "the current salary" a database guarantee rather than an ordering
-- convention in application code. The versioning action closes the old row and
-- inserts the new one in that order, so this constraint is what turns a bug in
-- that sequence into a loud failure instead of two live salaries.
-- ----------------------------------------------------------------------------
drop index if exists salary_one_open_structure;
create unique index salary_one_open_structure
  on salary_structures (profile_id)
  where effective_to is null;

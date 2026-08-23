import { createClient } from "@/lib/supabase/server";
import { countLeaveDays, type LeaveStatus, type LeaveTypeCode } from "@/lib/leave-days";

/**
 * Time-off reads.
 *
 * Balances come from v_leave_balance, which is `allocated_days - sum(approved)`.
 * There is no balance column anywhere and nothing decrements: approving a
 * request changes `status`, and the next read of the view reflects it. The same
 * property is what makes attendance flip to `leave` with no second write.
 *
 * The view is security_invoker, so RLS decides the row set — an employee sees
 * their own balance, a manager sees everyone's. No role branch belongs here.
 */

export type LeaveTypeOption = {
  id: string;
  name: string;
  code: LeaveTypeCode;
  isPaid: boolean;
  requiresAttachment: boolean;
};

export async function listLeaveTypes(): Promise<LeaveTypeOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leave_types")
    .select("id, name, code, is_paid, requires_attachment")
    .order("name");

  return ((data ?? []) as {
    id: string;
    name: string;
    code: string;
    is_paid: boolean;
    requires_attachment: boolean;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code as LeaveTypeCode,
    isPaid: row.is_paid,
    requiresAttachment: row.requires_attachment,
  }));
}

// ---------------------------------------------------------------------------
// Balances — read, never stored
// ---------------------------------------------------------------------------
export type Balance = {
  leaveTypeId: string;
  leaveType: string;
  allocated: number;
  used: number;
  available: number;
};

export async function getBalances(profileId: string): Promise<Balance[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_leave_balance")
    .select("leave_type_id, leave_type, allocated_days, used_days, available_days")
    .eq("profile_id", profileId)
    .order("leave_type");

  return ((data ?? []) as {
    leave_type_id: string;
    leave_type: string;
    allocated_days: number | string;
    used_days: number | string;
    available_days: number | string;
  }[]).map((row) => ({
    leaveTypeId: row.leave_type_id,
    leaveType: row.leave_type,
    allocated: Number(row.allocated_days),
    used: Number(row.used_days),
    available: Number(row.available_days),
  }));
}

/** One balance, by leave type. Used by the submit action's balance check. */
export async function getBalanceFor(
  profileId: string,
  leaveTypeId: string,
): Promise<Balance | null> {
  const balances = await getBalances(profileId);
  return balances.find((b) => b.leaveTypeId === leaveTypeId) ?? null;
}

// ---------------------------------------------------------------------------
// Holidays — needed to turn a date range into chargeable days
// ---------------------------------------------------------------------------
export async function getHolidayDates(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("holidays").select("date").order("date");
  return ((data ?? []) as { date: string }[]).map((row) => row.date);
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
export type LeaveRequestRow = {
  id: string;
  profileId: string;
  requesterName: string;
  requesterLoginId: string;
  avatarUrl: string | null;
  leaveTypeId: string;
  leaveType: string;
  leaveTypeCode: LeaveTypeCode;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  hasAttachment: boolean;
  status: LeaveStatus;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionComment: string | null;
  createdAt: string | null;
};

type RawRequest = {
  id: string;
  profile_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number | string;
  reason: string | null;
  attachment_url: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_comment: string | null;
  created_at: string | null;
};

/**
 * Requests visible to the caller. RLS returns own-only for an employee and
 * everything for a manager, so `scope` narrows a manager's view rather than
 * granting anything: passing a profileId is a filter, not an authorisation.
 */
export async function listLeaveRequests(scope?: { profileId?: string }): Promise<LeaveRequestRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leave_requests")
    .select(
      "id, profile_id, leave_type_id, start_date, end_date, days, reason, attachment_url, status, decided_by, decided_at, decision_comment, created_at",
    )
    .order("start_date", { ascending: false });

  if (scope?.profileId) query = query.eq("profile_id", scope.profileId);

  const { data } = await query;
  const rows = (data ?? []) as RawRequest[];
  if (rows.length === 0) return [];

  // Names are resolved separately rather than through an embedded join: the
  // requester and the decider are both `profiles`, and PostgREST cannot
  // disambiguate two FKs to the same table without hint syntax that breaks
  // quietly when a column is renamed.
  const ids = [
    ...new Set(rows.flatMap((r) => [r.profile_id, r.decided_by]).filter((v): v is string => Boolean(v))),
  ];

  const [{ data: people }, { data: types }, deciderNames] = await Promise.all([
    supabase.from("profiles").select("id, full_name, login_id, avatar_url").in("id", ids),
    supabase.from("leave_types").select("id, name, code"),
    resolveDeciderNames(rows),
  ]);

  const byPerson = new Map(
    ((people ?? []) as { id: string; full_name: string; login_id: string; avatar_url: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );
  const byType = new Map(
    ((types ?? []) as { id: string; name: string; code: string }[]).map((t) => [t.id, t]),
  );

  return rows.map((row) => {
    const person = byPerson.get(row.profile_id);
    const type = byType.get(row.leave_type_id);

    return {
      id: row.id,
      profileId: row.profile_id,
      requesterName: person?.full_name ?? "Unknown",
      requesterLoginId: person?.login_id ?? "—",
      avatarUrl: person?.avatar_url ?? null,
      leaveTypeId: row.leave_type_id,
      leaveType: type?.name ?? "Leave",
      leaveTypeCode: (type?.code ?? "paid") as LeaveTypeCode,
      startDate: row.start_date,
      endDate: row.end_date,
      days: Number(row.days),
      reason: row.reason,
      // The path is never handed to the client. A signed URL is minted on
      // demand by the server action, so a leaked prop cannot become a leaked
      // sick note.
      hasAttachment: Boolean(row.attachment_url),
      status: row.status as LeaveStatus,
      // decided_by IS NULL means the system decided it (Innovation 3), which is
      // a different fact from "a person decided it and I can't read their
      // name" — labelling the second case "System" would credit a human
      // approval to the auto-approve rule.
      decidedByName: row.decided_by
        ? (byPerson.get(row.decided_by)?.full_name ?? deciderNames.get(row.decided_by) ?? "Your approver")
        : row.decided_at
          ? "System"
          : null,
      decidedAt: row.decided_at,
      decisionComment: row.decision_comment,
      createdAt: row.created_at,
    };
  });
}

/**
 * Approver names, for rows the caller cannot read the approver's profile from.
 *
 * RLS on `profiles` is `id = auth.uid() or is_manager()`, so an employee cannot
 * read the row of the manager who decided their leave — which left every human
 * decision rendering as "System". Resolved with the service role instead, and
 * deliberately narrow: full_name only, and only for ids that already appear as
 * `decided_by` on a request this caller is allowed to see. Who approved your
 * leave is information you are owed; it is not a way to enumerate the org.
 */
async function resolveDeciderNames(rows: RawRequest[]): Promise<Map<string, string>> {
  const deciderIds = [...new Set(rows.map((r) => r.decided_by).filter((v): v is string => Boolean(v)))];
  if (deciderIds.length === 0) return new Map();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, full_name")
    .in("id", deciderIds);

  return new Map(((data ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name]));
}

/** Org-wide pending count, for the admin chip. RLS makes this own-only for an
 *  employee, which is why the chip is only rendered for managers. */
export async function getPendingCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Innovation 2 — team conflict warning
// ---------------------------------------------------------------------------
export type TeamConflict = {
  count: number;
  /** First few names, so the warning is concrete rather than a bare number. */
  names: string[];
};

/**
 * How many teammates already have APPROVED leave overlapping this range.
 *
 * "Teammate" is same department, falling back to same manager when the person
 * has no department — the two definitions the master plan offers. It is a
 * warning, never a block: a real conflict is a staffing decision, and the
 * system's job is to make sure nobody discovers it after the fact.
 *
 * Note the row set an employee can see: RLS limits leave_requests to their own
 * rows, so this query is issued with the service role and returns ONLY an
 * aggregate plus first names — never the reason, dates or type of anyone else's
 * leave. That is the whole reason it is a count and not a list.
 */
export async function countTeamConflicts(
  profileId: string,
  startDate: string,
  endDate: string,
): Promise<TeamConflict> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: me } = await admin
    .from("profiles")
    .select("id, org_id, department, manager_id")
    .eq("id", profileId)
    .maybeSingle();

  const self = me as {
    id: string;
    org_id: string;
    department: string | null;
    manager_id: string | null;
  } | null;
  if (!self) return { count: 0, names: [] };

  let peers = admin.from("profiles").select("id, full_name").eq("org_id", self.org_id).neq("id", profileId);
  if (self.department) peers = peers.eq("department", self.department);
  else if (self.manager_id) peers = peers.eq("manager_id", self.manager_id);
  else return { count: 0, names: [] };

  const { data: peerRows } = await peers;
  const peerList = (peerRows ?? []) as { id: string; full_name: string }[];
  if (peerList.length === 0) return { count: 0, names: [] };

  const { data: overlapping } = await admin
    .from("leave_requests")
    .select("profile_id")
    .in("profile_id", peerList.map((p) => p.id))
    .eq("status", "approved")
    // Two ranges overlap when each starts before the other ends.
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  const conflicted = new Set(((overlapping ?? []) as { profile_id: string }[]).map((r) => r.profile_id));
  const names = peerList.filter((p) => conflicted.has(p.id)).map((p) => p.full_name);

  return { count: names.length, names: names.slice(0, 3) };
}

/**
 * The same conflict figure, for a whole queue of requests at once.
 *
 * Innovation 2 is described as informing "the employee and later the approver".
 * The modal covers the employee; this covers the approver, which is where it
 * actually changes a decision — the master plan's claim is that it "turns
 * approval from a rubber-stamp into a decision", and that only happens if the
 * person deciding can see it.
 *
 * Two queries total, not one per row. A manager can read every profile and
 * every leave request under RLS, so the overlap is computed in memory rather
 * than issuing N round trips for a queue of N.
 */
export async function conflictsForRequests(
  requests: { id: string; profileId: string; startDate: string; endDate: string }[],
): Promise<Map<string, TeamConflict>> {
  const out = new Map<string, TeamConflict>();
  if (requests.length === 0) return out;

  const supabase = await createClient();
  const [{ data: people }, { data: approved }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, department, manager_id"),
    supabase.from("leave_requests").select("profile_id, start_date, end_date").eq("status", "approved"),
  ]);

  const peopleList = (people ?? []) as {
    id: string;
    full_name: string;
    department: string | null;
    manager_id: string | null;
  }[];
  const approvedList = (approved ?? []) as {
    profile_id: string;
    start_date: string;
    end_date: string;
  }[];

  const byId = new Map(peopleList.map((p) => [p.id, p]));

  for (const request of requests) {
    const self = byId.get(request.profileId);
    if (!self) {
      out.set(request.id, { count: 0, names: [] });
      continue;
    }

    // Same definition of "teammate" as countTeamConflicts: department, falling
    // back to manager. Kept in step with that function deliberately — two
    // different answers to "who is my team" shown on two screens would be worse
    // than showing none.
    const isPeer = (other: { id: string; department: string | null; manager_id: string | null }) => {
      if (other.id === self.id) return false;
      if (self.department) return other.department === self.department;
      if (self.manager_id) return other.manager_id === self.manager_id;
      return false;
    };

    const names = new Set<string>();
    for (const leave of approvedList) {
      // Two ranges overlap when each starts before the other ends.
      if (leave.start_date > request.endDate || leave.end_date < request.startDate) continue;
      const person = byId.get(leave.profile_id);
      if (person && isPeer(person)) names.add(person.full_name);
    }

    const list = [...names];
    out.set(request.id, { count: list.length, names: list.slice(0, 3) });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Allocation overview (admin sub-tab) — a read-only roll-up of the view
// ---------------------------------------------------------------------------
export type AllocationRow = {
  profileId: string;
  fullName: string;
  loginId: string;
  department: string | null;
  balances: Balance[];
};

export async function listAllocations(): Promise<AllocationRow[]> {
  const supabase = await createClient();

  const [{ data: people }, { data: balances }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, login_id, department").order("full_name"),
    supabase
      .from("v_leave_balance")
      .select("profile_id, leave_type_id, leave_type, allocated_days, used_days, available_days"),
  ]);

  const byProfile = new Map<string, Balance[]>();
  for (const row of (balances ?? []) as {
    profile_id: string;
    leave_type_id: string;
    leave_type: string;
    allocated_days: number | string;
    used_days: number | string;
    available_days: number | string;
  }[]) {
    const list = byProfile.get(row.profile_id) ?? [];
    list.push({
      leaveTypeId: row.leave_type_id,
      leaveType: row.leave_type,
      allocated: Number(row.allocated_days),
      used: Number(row.used_days),
      available: Number(row.available_days),
    });
    byProfile.set(row.profile_id, list);
  }

  return ((people ?? []) as {
    id: string;
    full_name: string;
    login_id: string;
    department: string | null;
  }[]).map((person) => ({
    profileId: person.id,
    fullName: person.full_name,
    loginId: person.login_id,
    department: person.department,
    balances: (byProfile.get(person.id) ?? []).sort((a, b) => a.leaveType.localeCompare(b.leaveType)),
  }));
}

/** Chargeable days for a range, computed against the org's real holidays. */
export async function chargeableDays(startDate: string, endDate: string) {
  const holidays = new Set(await getHolidayDates());
  return countLeaveDays(startDate, endDate, holidays);
}

"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { chargeableDays, countTeamConflicts, getBalanceFor, listLeaveTypes } from "@/lib/leave";
import {
  AUTO_APPROVAL_COMMENT,
  formatDays,
  leaveTypeLabel,
  qualifiesForAutoApproval,
} from "@/lib/leave-days";
import { cleanString } from "@/lib/validation";
import type { LeaveDecisionState, LeaveRequestState } from "@/lib/form-state";

/**
 * Time-off mutations.
 *
 * ============================================================================
 * THE ONE RULE OF THIS FILE
 *
 * Nothing here writes to attendance_punches or any attendance table. Not on
 * submit, not on approval, not ever. v_daily_attendance already joins approved
 * leave requests, so the moment `status` becomes 'approved' the attendance view
 * reports those dates as `leave` on its next read. There is nothing to sync,
 * and a sync is precisely what would let the two disagree.
 *
 * Likewise no balance is written. v_leave_balance is
 * `allocated_days - sum(days) filter (status = 'approved')`, so the same status
 * change moves the balance. There is no balance column to decrement.
 * ============================================================================
 */

const BUCKET = "leave-documents";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function refresh() {
  revalidatePath("/time-off");
  revalidatePath("/attendance");
  // The bell lives in the layout, so a notification only appears if the shell
  // is revalidated too.
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Submit a request
// ---------------------------------------------------------------------------
export async function requestLeave(
  _prev: LeaveRequestState,
  formData: FormData,
): Promise<LeaveRequestState> {
  const user = await getCurrentUser();
  if (!user) return fail("Your session expired. Sign in again.");

  const leaveTypeId = cleanString(formData.get("leaveTypeId"));
  const startDate = cleanString(formData.get("startDate"));
  const endDate = cleanString(formData.get("endDate"));
  const reason = typeof formData.get("reason") === "string" ? String(formData.get("reason")).trim() : "";
  const attachment = formData.get("attachment");

  // ---- Validation. Server-side, all of it. The modal shows the same rules as
  // a convenience; this is the gate. -------------------------------------
  if (!isDate(startDate) || !isDate(endDate)) return fail("Choose a start and end date.");
  if (endDate < startDate) return fail("The end date can't be before the start date.");

  // Fetched together, validated in order below. These two reads do not depend
  // on each other, and awaiting them in sequence was a measurable share of the
  // submit latency.
  const [types, dayCount] = await Promise.all([
    listLeaveTypes(),
    chargeableDays(startDate, endDate),
  ]);

  const type = types.find((t) => t.id === leaveTypeId);
  // The type id is checked against the list rather than trusted, so a crafted
  // request cannot point at another org's leave type.
  if (!type) return fail("Choose a leave type.");

  const { leaveDays, calendarDays } = dayCount;
  if (calendarDays === 0) return fail("That date range doesn't look right.");
  if (leaveDays === 0) {
    return fail("Every day in that range is a weekend or a holiday — you're already off.");
  }

  // Sick leave needs the certificate, per the wireframe's helper text. Driven by
  // the leave type's own requires_attachment flag rather than a hard-coded
  // "sick", so adding a type that needs proof is a data change.
  const hasAttachment = attachment instanceof File && attachment.size > 0;
  if (type.requiresAttachment && !hasAttachment) {
    return fail(`${type.name} needs a supporting document — attach the certificate.`);
  }
  if (hasAttachment) {
    const file = attachment as File;
    if (file.size > MAX_ATTACHMENT_BYTES) return fail("That file is larger than 5 MB.");
    if (!ATTACHMENT_TYPES.includes(file.type)) return fail("Attach a PDF, PNG or JPEG.");
  }

  // Balance and overlap are independent of each other, so they go together too.
  const supabase = await createClient();
  const [balance, { data: clashing }] = await Promise.all([
    getBalanceFor(user.id, type.id),
    // Overlap. Also a database constraint (0005), so a request that races past
    // this check is still refused — this exists to give a sentence instead of a
    // constraint error.
    supabase
      .from("leave_requests")
      .select("id, start_date, end_date, status")
      .eq("profile_id", user.id)
      .in("status", ["pending", "approved"])
      .lte("start_date", endDate)
      .gte("end_date", startDate)
      .limit(1),
  ]);

  // Unpaid leave has no ceiling by definition — that is what makes it unpaid —
  // so it is exempt rather than special-cased later.
  if (type.isPaid) {
    const available = balance?.available ?? 0;
    if (leaveDays > available) {
      return fail(
        `That's ${formatDays(leaveDays)} days but you have ${formatDays(available)} ${type.name} left.`,
      );
    }
  }

  if (clashing?.length) return fail("You already have a request covering those dates.");

  // ---- Insert, as the requester ------------------------------------------
  // Deliberately the user's own client, not the service role. The RLS policy is
  // `with check (profile_id = auth.uid())` and 0005 grants INSERT on only the
  // request columns — so Postgres itself guarantees this row belongs to the
  // caller and arrives as `pending`, whatever this code does.
  const { data: inserted, error } = await supabase
    .from("leave_requests")
    .insert({
      profile_id: user.id,
      leave_type_id: type.id,
      start_date: startDate,
      end_date: endDate,
      days: leaveDays,
      reason: reason || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    // 23P01 is the exclusion constraint from 0005 — an overlap that slipped
    // past the check above.
    if (error?.code === "23P01") return fail("You already have a request covering those dates.");
    return fail("Could not submit that request. Try again.");
  }

  const requestId = (inserted as { id: string }).id;
  const admin = createAdminClient();

  // ---- Attachment ---------------------------------------------------------
  // Uploaded after the row exists so the object is named by the request it
  // belongs to. The bucket is private; nothing ever hands out the raw path.
  if (hasAttachment) {
    const problem = await storeAttachment(admin, user.id, requestId, attachment as File);
    if (problem) {
      // The request itself is valid and submitted. Say what failed rather than
      // silently dropping the certificate the approver is going to look for.
      return { error: "Request submitted, but the attachment did not upload. Re-attach it.", submitted: true, autoApproved: false };
    }
  }

  // ---- Innovation 3 — auto-approve ---------------------------------------
  // The rule itself is qualifiesForAutoApproval() in lib/leave-days.ts; this is
  // only the plumbing. Note the client: the service role, not the requester's.
  // 0005 revokes UPDATE of the decision columns from the requester, so an
  // employee's own session physically cannot approve this row. The approval is
  // an act of the system, which is also why decided_by is left null.
  const autoApprove = qualifiesForAutoApproval({
    typeCode: type.code,
    leaveDays,
    availableDays: balance?.available ?? 0,
  });

  if (autoApprove) {
    const { error: flipError } = await admin
      .from("leave_requests")
      .update({
        status: "approved",
        decided_by: null, // system, not a person
        decided_at: new Date().toISOString(),
        decision_comment: AUTO_APPROVAL_COMMENT,
      })
      .eq("id", requestId);

    if (!flipError) {
      await notifyManagers(admin, user.orgId, user.id, {
        type: "leave_auto_approved",
        title: `${user.fullName}'s sick leave was auto-approved`,
        body: `${dateRangeText(startDate, endDate)} · ${formatDays(leaveDays)} day. No action needed.`,
      });
      refresh();
      return { error: null, submitted: true, autoApproved: true };
    }
    // Falling through leaves it pending, which is the safe direction: a request
    // waiting for a human is recoverable, an unrecorded absence is not.
  }

  await notifyManagers(admin, user.orgId, user.id, {
    type: "leave_submitted",
    title: `${user.fullName} requested ${leaveTypeLabel(type.code)}`,
    body: `${dateRangeText(startDate, endDate)} · ${formatDays(leaveDays)} day${leaveDays === 1 ? "" : "s"}${reason ? ` · "${truncate(reason, 80)}"` : ""}`,
  });

  refresh();
  return { error: null, submitted: true, autoApproved: false };
}

// ---------------------------------------------------------------------------
// Approve / reject
// ---------------------------------------------------------------------------
export async function decideLeave(
  _prev: LeaveDecisionState,
  formData: FormData,
): Promise<LeaveDecisionState> {
  const requestId = cleanString(formData.get("requestId"));
  const decision = cleanString(formData.get("decision"));
  const comment = typeof formData.get("comment") === "string" ? String(formData.get("comment")).trim() : "";

  if (!requestId) return { error: "Missing request.", decided: false };
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Choose approve or reject.", decided: false };
  }

  const actor = await getCurrentUser();
  if (!actor) return { error: "Your session expired. Sign in again.", decided: false };

  // Affordance-hiding is not access control, so the role is checked here too —
  // and then again by RLS on the update below.
  if (!actor.isManager) {
    return { error: "Only HR and admins can decide leave requests.", decided: false };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id, profile_id, leave_type_id, start_date, end_date, days, status")
    .eq("id", requestId)
    .maybeSingle();

  const request = existing as {
    id: string;
    profile_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    days: number | string;
    status: string;
  } | null;

  if (!request) return { error: "That request isn't available to you.", decided: false };
  if (request.status !== "pending") {
    return { error: `That request is already ${request.status}.`, decided: false };
  }

  // Nobody decides their own leave — an HR officer is also an employee. The
  // policy from 0005 refuses this at the database too; this is the version that
  // produces a sentence instead of a silent zero-row update.
  if (request.profile_id === actor.id) {
    return { error: "You can't decide your own leave request. Ask another approver.", decided: false };
  }

  // Approving beyond the balance would push v_leave_balance negative, and a
  // negative balance is a payroll problem rather than a display one.
  if (decision === "approved") {
    const balance = await getBalanceFor(request.profile_id, request.leave_type_id);
    const types = await listLeaveTypes();
    const type = types.find((t) => t.id === request.leave_type_id);
    if (type?.isPaid && balance && Number(request.days) > balance.available) {
      return {
        error: `Approving this would exceed their balance — ${formatDays(balance.available)} days left, ${formatDays(Number(request.days))} requested.`,
        decided: false,
      };
    }
  }

  // The manager's OWN client. 0005's policy is
  //   using (is_manager() and profile_id <> auth.uid())
  // with column grants limited to the four decision columns, so the dates and
  // day count of the request cannot change while it is being approved: what
  // gets approved is what was asked for.
  const { data: updated, error } = await supabase
    .from("leave_requests")
    .update({
      status: decision,
      decided_by: actor.id,
      decided_at: new Date().toISOString(),
      decision_comment: comment || null,
    })
    .eq("id", requestId)
    .eq("status", "pending") // lose the race rather than overwrite a decision
    .select("id");

  if (error) return { error: "Could not save that decision. Try again.", decided: false };
  if (!updated?.length) {
    return { error: "That request was already decided by someone else.", decided: false };
  }

  // NOTE: this is the end of the write path. No attendance row is created,
  // updated or deleted. If the dates fall in the current month, the employee's
  // attendance now reads `leave` for them — because the view derives it.
  const admin = createAdminClient();

  await admin.from("notifications").insert({
    profile_id: request.profile_id,
    type: "leave_decided",
    title: `Your leave was ${decision}`,
    body: `${dateRangeText(request.start_date, request.end_date)} · ${formatDays(Number(request.days))} day${Number(request.days) === 1 ? "" : "s"}${comment ? ` · "${truncate(comment, 80)}"` : ""}`,
    link: "/time-off",
  });

  await admin.from("audit_log").insert({
    org_id: actor.orgId,
    actor_id: actor.id,
    entity: "leave_requests",
    entity_id: requestId,
    action: decision,
    before: { status: "pending" },
    after: { status: decision, decision_comment: comment || null },
  });

  refresh();
  return { error: null, decided: true };
}

// ---------------------------------------------------------------------------
// Innovation 2 — team conflict warning (a read, called from the modal)
// ---------------------------------------------------------------------------
export async function checkTeamConflicts(
  startDate: string,
  endDate: string,
): Promise<{ count: number; names: string[]; days: number }> {
  const user = await getCurrentUser();
  if (!user) return { count: 0, names: [], days: 0 };
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) {
    return { count: 0, names: [], days: 0 };
  }

  // Always about the caller's own team, from the session — never a profile id
  // sent by the client.
  const [conflict, days] = await Promise.all([
    countTeamConflicts(user.id, startDate, endDate),
    chargeableDays(startDate, endDate),
  ]);

  return { count: conflict.count, names: conflict.names, days: days.leaveDays };
}

// ---------------------------------------------------------------------------
// Attachment — signed URL on demand
// ---------------------------------------------------------------------------
export async function getAttachmentUrl(
  requestId: string,
): Promise<{ url: string | null; error: string | null }> {
  const actor = await getCurrentUser();
  if (!actor) return { url: null, error: "Your session expired." };

  const supabase = await createClient();
  // RLS on leave_requests decides visibility: own rows for an employee, all for
  // a manager. So if this select returns nothing, the caller may not see it.
  const { data } = await supabase
    .from("leave_requests")
    .select("id, profile_id, attachment_url")
    .eq("id", requestId)
    .maybeSingle();

  const row = data as { id: string; profile_id: string; attachment_url: string | null } | null;
  if (!row) return { url: null, error: "That document isn't available to you." };
  if (!row.attachment_url) return { url: null, error: "No document was attached." };
  if (row.profile_id !== actor.id && !actor.isManager) {
    return { url: null, error: "That document isn't available to you." };
  }

  // 60 seconds: long enough to open, short enough that a copied URL in a chat
  // window is worthless by the time anyone else clicks it.
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(row.attachment_url, 60);

  if (error || !signed) return { url: null, error: "Could not open that document." };
  return { url: signed.signedUrl, error: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fail(message: string): LeaveRequestState {
  return { error: message, submitted: false, autoApproved: false };
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function dateRangeText(startDate: string, endDate: string): string {
  const format = (day: string) => {
    const [y, m, d] = day.split("-");
    return `${d}/${m}/${y}`;
  };
  return startDate === endDate ? format(startDate) : `${format(startDate)} – ${format(endDate)}`;
}

/**
 * Store the certificate and record its path.
 *
 * Path is `<profile_id>/<request_id>.<ext>` because the storage policy in 0005
 * reads the first segment as the owner. Changing this convention silently
 * breaks that policy, which is why it is written down in both places.
 */
async function storeAttachment(
  admin: SupabaseClient,
  profileId: string,
  requestId: string,
  file: File,
): Promise<boolean> {
  const extension = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${profileId}/${requestId}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return true;

  const { error } = await admin
    .from("leave_requests")
    .update({ attachment_url: path })
    .eq("id", requestId);

  return Boolean(error);
}

/**
 * Notify everyone who can act on this. Managers only, and never the requester
 * themselves — an HR officer filing their own leave should not get a "please
 * approve this" note about it.
 */
async function notifyManagers(
  admin: SupabaseClient,
  orgId: string,
  requesterId: string,
  message: { type: string; title: string; body: string },
): Promise<void> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
    .in("role", ["admin", "hr"])
    .neq("id", requesterId);

  const recipients = (data ?? []) as { id: string }[];
  if (recipients.length === 0) return;

  await admin.from("notifications").insert(
    recipients.map((person) => ({
      profile_id: person.id,
      type: message.type,
      title: message.title,
      body: message.body,
      link: "/time-off",
    })),
  );
}

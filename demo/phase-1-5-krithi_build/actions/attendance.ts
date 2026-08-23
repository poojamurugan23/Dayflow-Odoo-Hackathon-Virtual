"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { IST, todayIST } from "@/lib/attendance";
import type { PunchState } from "@/lib/form-state";

/**
 * Attendance mutations.
 *
 * These write RAW PUNCHES and nothing else — punch_in, punch_out,
 * is_regularized, source. There is no status to write: v_daily_attendance
 * derives it from these rows plus the schedule, holidays and approved leave.
 * Writing a status here is what the whole architecture exists to prevent.
 *
 * The RLS policy on attendance_punches is
 *   FOR ALL USING (profile_id = auth.uid() or is_manager())
 *   WITH CHECK (profile_id = auth.uid())
 * so the caller's own client is used throughout: Postgres itself refuses a
 * punch written against somebody else's id. No service role needed.
 */

function refresh() {
  revalidatePath("/attendance");
  revalidatePath("/employees");
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Check in
// ---------------------------------------------------------------------------
export async function checkIn(): Promise<PunchState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const supabase = await createClient();

  // Refuse a second open punch. Without this, a double-click leaves two open
  // rows and the view splits the day in two.
  const { data: existing } = await supabase
    .from("attendance_punches")
    .select("id")
    .eq("profile_id", user.id)
    .is("punch_out", null)
    .limit(1)
    .maybeSingle();

  if (existing) return { error: "You already have an open session." };

  const { error } = await supabase.from("attendance_punches").insert({
    profile_id: user.id,
    punch_in: new Date().toISOString(),
    source: "web",
  });

  if (error) return { error: "Could not check you in. Try again." };

  refresh();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Check out
// ---------------------------------------------------------------------------
export async function checkOut(): Promise<PunchState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const supabase = await createClient();

  const { data: open } = await supabase
    .from("attendance_punches")
    .select("id, punch_in")
    .eq("profile_id", user.id)
    .is("punch_out", null)
    .order("punch_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = open as { id: string; punch_in: string } | null;
  if (!row) return { error: "You don't have an open session." };

  const { error } = await supabase
    .from("attendance_punches")
    .update({ punch_out: new Date().toISOString() })
    .eq("id", row.id);

  if (error) return { error: "Could not check you out. Try again." };

  refresh();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Innovation 1 — regularization
//
// A forgotten check-out silently costs payable days, because the view scores
// the day on hours worked. This lets the person state when they actually left.
//
// In this phase the correction applies immediately. A production version would
// insert it as a pending request for the manager to approve — the punch already
// carries is_regularized so an approval queue can be layered on without
// touching the derivation.
// ---------------------------------------------------------------------------
export async function regularizePunch(formData: FormData): Promise<PunchState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const punchId = typeof formData.get("punchId") === "string" ? String(formData.get("punchId")) : "";
  const timeValue = typeof formData.get("checkOutTime") === "string" ? String(formData.get("checkOutTime")) : "";

  if (!punchId) return { error: "Missing the punch to correct." };
  if (!/^\d{2}:\d{2}$/.test(timeValue)) return { error: "Enter a time as HH:MM." };

  const supabase = await createClient();

  // RLS lets a manager read anyone's punch and an employee only their own, so
  // this select doubles as the authorisation check.
  const { data: punch } = await supabase
    .from("attendance_punches")
    .select("id, profile_id, punch_in, punch_out")
    .eq("id", punchId)
    .maybeSingle();

  const row = punch as { id: string; profile_id: string; punch_in: string; punch_out: string | null } | null;
  if (!row) return { error: "That record isn't available to you." };
  if (row.punch_out) return { error: "That day already has a check-out." };
  if (row.profile_id !== user.id && !user.isManager) {
    return { error: "You can only correct your own attendance." };
  }

  const punchOut = istTimeOnDayOf(row.punch_in, timeValue);
  if (!punchOut) return { error: "Enter a time as HH:MM." };

  if (new Date(punchOut).getTime() <= new Date(row.punch_in).getTime()) {
    return { error: "Check-out has to be after check-in." };
  }
  if (new Date(punchOut).getTime() > Date.now()) {
    return { error: "That check-out is in the future." };
  }

  const { error } = await supabase
    .from("attendance_punches")
    .update({
      punch_out: punchOut,
      is_regularized: true,
      note: `Check-out corrected to ${timeValue} IST by ${user.fullName}`,
    })
    .eq("id", row.id);

  if (error) return { error: "Could not save that correction. Try again." };

  refresh();
  return { error: null };
}

/**
 * Combine the IST calendar day of `punchIn` with an HH:MM wall-clock time and
 * return the corresponding instant.
 *
 * Done by arithmetic rather than string-building because IST is +05:30: naively
 * writing `${day}T18:30:00Z` would store the time as UTC and land five and a
 * half hours out.
 */
function istTimeOnDayOf(punchIn: string, hhmm: string): string | null {
  const [hours, minutes] = hhmm.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;

  const dayIST = new Date(punchIn).toLocaleDateString("en-CA", { timeZone: IST });
  // IST has no daylight saving, so the offset is a constant +05:30.
  const IST_OFFSET_MINUTES = 330;
  const utcMillis = Date.UTC(
    Number(dayIST.slice(0, 4)),
    Number(dayIST.slice(5, 7)) - 1,
    Number(dayIST.slice(8, 10)),
    hours,
    minutes,
  ) - IST_OFFSET_MINUTES * 60_000;

  return new Date(utcMillis).toISOString();
}

/** Exposed for the nightly sweep and tests. */
export async function todayInIST(): Promise<string> {
  return todayIST();
}

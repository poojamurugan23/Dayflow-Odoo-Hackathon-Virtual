import { createClient } from "@/lib/supabase/server";
import type { DayStatus } from "@/lib/display";

export type { DayStatus };

const KNOWN: readonly DayStatus[] = [
  "present",
  "absent",
  "half_day",
  "leave",
  "weekoff",
  "holiday",
];

/**
 * Today's status per profile, read from v_daily_attendance.
 *
 * The view is the source of truth — status is derived from punches, holidays,
 * the week pattern and approved leave. There is deliberately no status column
 * on profiles: a stored one drifts the first time a leave is approved and
 * nobody remembers to update the attendance row.
 *
 * The view is security_invoker, so RLS applies to the CALLER: an employee gets
 * one row (their own), a manager gets everyone. No filtering needed here.
 */
export async function getTodayStatuses(): Promise<Map<string, DayStatus>> {
  const supabase = await createClient();

  // Local calendar day, not UTC — an IST evening is still "today" for HR.
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const { data, error } = await supabase
    .from("v_daily_attendance")
    .select("profile_id, status")
    .eq("day", today);

  const statuses = new Map<string, DayStatus>();
  if (error || !data) return statuses;

  for (const row of data as { profile_id: string; status: string }[]) {
    if (isDayStatus(row.status)) statuses.set(row.profile_id, row.status);
  }
  return statuses;
}

function isDayStatus(value: string): value is DayStatus {
  return (KNOWN as readonly string[]).includes(value);
}

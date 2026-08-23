import { createClient } from "@/lib/supabase/server";
import type { DayStatus } from "@/lib/display";

export type { DayStatus };

/**
 * Attendance reads. Every display in the app comes from v_daily_attendance —
 * status is derived from punches + schedule + holidays + approved leave, never
 * stored. The only thing written anywhere is a raw punch row.
 *
 * The view is security_invoker, so RLS decides the row set: an employee gets
 * their own days, a manager gets everyone's. No role branch belongs in here.
 */

export const IST = "Asia/Kolkata";

/** Today's date in IST, as YYYY-MM-DD. Not UTC: an IST evening is still today. */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST });
}

/** HH:MM in IST. Punches are timestamptz; this is the only place they surface. */
export function timeIST(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function monthLabel(monthStart: string): string {
  return new Date(`${monthStart}T00:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

export function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** First day of the month containing `day`. */
export function monthStartOf(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function addMonths(monthStart: string, delta: number): string {
  const [y, m] = monthStart.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Open punch — drives the systray
// ---------------------------------------------------------------------------
export type OpenPunch = {
  id: string;
  punchIn: string;
  /** True when the open punch started today (IST). A punch left open from an
   *  earlier day is not a live session — it is a forgotten check-out. */
  isToday: boolean;
};

export async function getOpenPunch(profileId: string): Promise<OpenPunch | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance_punches")
    .select("id, punch_in")
    .eq("profile_id", profileId)
    .is("punch_out", null)
    .order("punch_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { id: string; punch_in: string } | null;
  if (!row) return null;

  const punchDayIST = new Date(row.punch_in).toLocaleDateString("en-CA", { timeZone: IST });

  return { id: row.id, punchIn: row.punch_in, isToday: punchDayIST === todayIST() };
}

// ---------------------------------------------------------------------------
// Derived rows from the view
// ---------------------------------------------------------------------------
export type DayRow = {
  day: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  extraHours: number;
  status: DayStatus;
  /** A day with a check-in but no check-out. Costs payable days, so it is
   *  surfaced rather than left blank. */
  missingCheckout: boolean;
  /** The punch row to correct, when one needs regularizing. */
  punchId: string | null;
  isRegularized: boolean;
};

type ViewRow = {
  profile_id: string;
  day: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number | string;
  status: string;
};

/** Contracted hours per day, from the org's work schedule. */
async function hoursPerDay(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_schedules").select("hours_per_day").limit(1).maybeSingle();
  const row = data as { hours_per_day: number | string } | null;
  return row ? Number(row.hours_per_day) : 8;
}

/**
 * Extra hours is presentation arithmetic over the view's work_hours, not a
 * second source of truth: anything above the contracted day counts as extra.
 */
function extraOf(workHours: number, contracted: number, status: string): number {
  if (status === "weekoff" || status === "holiday") return workHours > 0 ? workHours : 0;
  return Math.max(0, workHours - contracted);
}

function toDayRow(
  row: ViewRow,
  contracted: number,
  punches: Map<string, { id: string; isRegularized: boolean }>,
): DayRow {
  const workHours = Number(row.work_hours) || 0;
  const status = row.status as DayStatus;
  const missingCheckout = Boolean(row.check_in) && !row.check_out;
  const punch = punches.get(`${row.profile_id}|${row.day}`);

  return {
    day: row.day,
    checkIn: row.check_in,
    checkOut: row.check_out,
    workHours,
    extraHours: extraOf(workHours, contracted, status),
    status,
    missingCheckout,
    punchId: punch?.id ?? null,
    isRegularized: punch?.isRegularized ?? false,
  };
}

/** Punch ids keyed by profile+IST day, so a row can offer Regularize. */
async function punchIndex(
  profileIds: string[] | null,
  from: string,
  to: string,
): Promise<Map<string, { id: string; isRegularized: boolean }>> {
  const supabase = await createClient();

  let query = supabase
    .from("attendance_punches")
    .select("id, profile_id, punch_in, is_regularized")
    // Widened by a day either side so IST/UTC boundaries cannot drop a punch.
    .gte("punch_in", `${addDays(from, -1)}T00:00:00Z`)
    .lte("punch_in", `${addDays(to, 1)}T23:59:59Z`);

  if (profileIds?.length) query = query.in("profile_id", profileIds);

  const { data } = await query;
  const index = new Map<string, { id: string; isRegularized: boolean }>();

  for (const row of (data ?? []) as {
    id: string;
    profile_id: string;
    punch_in: string;
    is_regularized: boolean;
  }[]) {
    const dayIST = new Date(row.punch_in).toLocaleDateString("en-CA", { timeZone: IST });
    index.set(`${row.profile_id}|${dayIST}`, { id: row.id, isRegularized: row.is_regularized });
  }
  return index;
}

export type MonthSummary = {
  daysPresent: number;
  leaveDays: number;
  workingDays: number;
  totalHours: number;
  extraHours: number;
};

export type MonthAttendance = {
  monthStart: string;
  rows: DayRow[];
  summary: MonthSummary;
  /** v_daily_attendance spans the CURRENT month only, so other months are
   *  legitimately empty rather than broken. */
  outsideViewRange: boolean;
};

export async function getMonthAttendance(
  profileId: string,
  monthStart: string,
): Promise<MonthAttendance> {
  const supabase = await createClient();
  const contracted = await hoursPerDay();
  const monthEnd = addDays(addMonths(monthStart, 1), -1);

  const { data } = await supabase
    .from("v_daily_attendance")
    .select("profile_id, day, check_in, check_out, work_hours, status")
    .eq("profile_id", profileId)
    .gte("day", monthStart)
    .lte("day", monthEnd)
    .order("day");

  const viewRows = (data ?? []) as ViewRow[];
  const punches = await punchIndex([profileId], monthStart, monthEnd);
  const rows = viewRows.map((row) => toDayRow(row, contracted, punches));

  const summary: MonthSummary = {
    // Mirrors v_payable_days: a half day is still a day you were here.
    daysPresent: rows.filter((r) => r.status === "present" || r.status === "half_day").length,
    leaveDays: rows.filter((r) => r.status === "leave").length,
    workingDays: rows.filter((r) => r.status !== "weekoff" && r.status !== "holiday").length,
    totalHours: rows.reduce((sum, r) => sum + r.workHours, 0),
    extraHours: rows.reduce((sum, r) => sum + r.extraHours, 0),
  };

  return {
    monthStart,
    rows,
    summary,
    outsideViewRange: rows.length === 0 && monthStart !== monthStartOf(todayIST()),
  };
}

// ---------------------------------------------------------------------------
// Admin day view
// ---------------------------------------------------------------------------
export type DayPerson = DayRow & {
  profileId: string;
  fullName: string;
  jobPosition: string | null;
  avatarUrl: string | null;
};

export async function getDayAttendance(day: string): Promise<DayPerson[]> {
  const supabase = await createClient();
  const contracted = await hoursPerDay();

  const { data } = await supabase
    .from("v_daily_attendance")
    .select("profile_id, day, check_in, check_out, work_hours, status")
    .eq("day", day);

  const viewRows = (data ?? []) as ViewRow[];
  if (viewRows.length === 0) return [];

  const ids = viewRows.map((r) => r.profile_id);
  const [{ data: people }, punches] = await Promise.all([
    supabase.from("profiles").select("id, full_name, job_position, avatar_url").in("id", ids),
    punchIndex(ids, day, day),
  ]);

  const byId = new Map(
    ((people ?? []) as { id: string; full_name: string; job_position: string | null; avatar_url: string | null }[])
      .map((p) => [p.id, p]),
  );

  return viewRows
    .map((row) => {
      const person = byId.get(row.profile_id);
      return {
        ...toDayRow(row, contracted, punches),
        profileId: row.profile_id,
        fullName: person?.full_name ?? "Unknown",
        jobPosition: person?.job_position ?? null,
        avatarUrl: person?.avatar_url ?? null,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Today's status per profile, for the grid dots and profile badge. */
export async function getTodayStatuses(): Promise<Map<string, DayStatus>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_daily_attendance")
    .select("profile_id, status")
    .eq("day", todayIST());

  const statuses = new Map<string, DayStatus>();
  if (error || !data) return statuses;

  for (const row of data as { profile_id: string; status: string }[]) {
    statuses.set(row.profile_id, row.status as DayStatus);
  }
  return statuses;
}

export function formatHours(hours: number): string {
  if (hours <= 0) return "0:00";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}:${String(minutes).padStart(2, "0")}`;
}

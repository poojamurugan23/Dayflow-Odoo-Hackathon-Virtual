/**
 * Leave day arithmetic. Pure — NOTHING here may import a server module.
 *
 * Same reason lib/display.ts exists: the request modal needs to show the day
 * count the moment the dates change, and the server action needs to compute the
 * authoritative figure. Both import from here, so there is one algorithm rather
 * than two that drift. The holiday list is passed in, because only the server
 * can read it.
 *
 * The weekend rule matches v_daily_attendance exactly — that view treats
 * `extract(dow) in (0,6)`, Sunday and Saturday, as week off. If one of these
 * two definitions ever changes, the other has to change with it or a day will
 * be billed as leave while attendance calls it a week off.
 */

export type LeaveTypeCode = "paid" | "sick" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

const DAY_MS = 86_400_000;

/** ISO date -> UTC midnight. Dates are calendar values here, never instants. */
function parse(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(time) ? null : time;
}

function toISO(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** Saturday or Sunday, read in UTC to match how the dates were parsed. */
export function isWeekend(day: string): boolean {
  const time = parse(day);
  if (time === null) return false;
  const dow = new Date(time).getUTCDay();
  return dow === 0 || dow === 6;
}

/** Every calendar date from start to end inclusive. Empty if the range is invalid. */
export function datesInRange(startDate: string, endDate: string): string[] {
  const start = parse(startDate);
  const end = parse(endDate);
  if (start === null || end === null || end < start) return [];

  // A guard rather than a limit anyone will hit: a 10-year range would
  // otherwise allocate 3,650 strings before validation ever sees it.
  if ((end - start) / DAY_MS > 366) return [];

  const days: string[] = [];
  for (let time = start; time <= end; time += DAY_MS) days.push(toISO(time));
  return days;
}

export type DayCount = {
  /** Days that actually cost leave: weekends and holidays excluded. */
  leaveDays: number;
  /** Calendar span, for "3 days off, 2 chargeable" style copy. */
  calendarDays: number;
  /** Which dates were excluded, so the modal can say why the number is lower. */
  excluded: { day: string; reason: "weekend" | "holiday" }[];
};

/**
 * Chargeable leave days in a range.
 *
 * Weekends and public holidays are excluded because v_daily_attendance already
 * reports those days as weekoff/holiday regardless of leave — charging balance
 * for a day the company was closed would be wrong, and the attendance view
 * would visibly disagree with the deduction.
 */
export function countLeaveDays(
  startDate: string,
  endDate: string,
  holidays: ReadonlySet<string>,
): DayCount {
  const days = datesInRange(startDate, endDate);
  const excluded: DayCount["excluded"] = [];

  for (const day of days) {
    // Weekend takes precedence in the reason, matching the view's CASE order.
    if (isWeekend(day)) excluded.push({ day, reason: "weekend" });
    else if (holidays.has(day)) excluded.push({ day, reason: "holiday" });
  }

  return { leaveDays: days.length - excluded.length, calendarDays: days.length, excluded };
}

export function leaveTypeLabel(code: LeaveTypeCode | string): string {
  switch (code) {
    case "paid":
      return "Paid Time Off";
    case "sick":
      return "Sick Leave";
    case "unpaid":
      return "Unpaid Leave";
    default:
      return code;
  }
}

export function leaveStatusLabel(status: LeaveStatus | string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/** "2.00" -> "2", "0.50" -> "0.5". The column is numeric(5,2). */
export function formatDays(days: number): string {
  return Number.isInteger(days) ? String(days) : String(Number(days.toFixed(2)));
}

/**
 * Innovation 3 — auto-approve, THE ONE PLACE THE RULE LIVES.
 *
 * Sick leave of one day or less, with balance available, is approved on submit.
 * The reasoning: a single sick day is the highest-volume, lowest-judgement
 * request in any HR system. Making someone with flu wait on an approval queue
 * to be told yes is the process serving itself. Anything longer, anything
 * unpaid, and anything without balance is a real decision and stays pending.
 *
 * Kept as a pure predicate so it can be pointed at in the demo and tested
 * without a database. actions/leave.ts is the only caller.
 */
export function qualifiesForAutoApproval(input: {
  typeCode: string;
  leaveDays: number;
  availableDays: number;
}): boolean {
  return input.typeCode === "sick" && input.leaveDays <= 1 && input.availableDays >= input.leaveDays;
}

export const AUTO_APPROVAL_COMMENT =
  "Auto-approved: sick leave of one day or less within your available balance.";

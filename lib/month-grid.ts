/**
 * Month-grid arithmetic for the time-off calendar. Pure — no server imports, no
 * calendar library.
 *
 * A dependency was considered and rejected: react-day-picker and friends bring
 * a locale layer, a controlled-selection model and a styling surface, none of
 * which a read-only leave calendar needs. What it actually needs is "give me the
 * cells of a month, Monday-first, with leading blanks" — which is the thirty
 * lines below.
 *
 * Dates are calendar values, handled in UTC throughout so a timezone offset can
 * never shift a day. Same reason lib/leave-days.ts does it that way, and the two
 * agree on the weekend rule.
 */

const DAY_MS = 86_400_000;

export type MonthCell = {
  /** ISO date, or null for a leading/trailing blank that pads the week row. */
  day: string | null;
  dayOfMonth: number | null;
  isWeekend: boolean;
};

export type MonthGrid = {
  /** First of the month, ISO. */
  monthStart: string;
  /** "September 2026" */
  label: string;
  /** 7 cells per week row, Monday first. */
  cells: MonthCell[];
};

/** SUNDAY-first, matching the wireframe's S M T W T F S column header. */
export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function monthGrid(monthStart: string): MonthGrid {
  const start = Date.parse(`${monthStart}T00:00:00Z`);
  const first = new Date(start);
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();

  // getUTCDay() already returns 0 for Sunday, which is the first column.
  const leading = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: MonthCell[] = [];
  for (let i = 0; i < leading; i += 1) cells.push({ day: null, dayOfMonth: null, isWeekend: false });

  for (let d = 1; d <= daysInMonth; d += 1) {
    const time = Date.UTC(year, month, d);
    const dow = new Date(time).getUTCDay();
    cells.push({
      day: new Date(time).toISOString().slice(0, 10),
      dayOfMonth: d,
      isWeekend: dow === 0 || dow === 6,
    });
  }

  // Pad to a whole number of week rows so every month renders the same height
  // and the three cards line up.
  while (cells.length % 7 !== 0) cells.push({ day: null, dayOfMonth: null, isWeekend: false });

  return {
    monthStart,
    label: first.toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" }),
    cells,
  };
}

/** The month containing `day`, then the following `count - 1` months. */
export function monthSequence(day: string, count: number): string[] {
  const [y, m] = day.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const total = (y * 12 + (m - 1)) + i;
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    out.push(`${year}-${String(month).padStart(2, "0")}-01`);
  }
  return out;
}

/** Inclusive range of ISO dates. Bounded, so a bad range cannot allocate wildly. */
export function expandRange(startDate: string, endDate: string): string[] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [];
  if ((end - start) / DAY_MS > 400) return [];

  const out: string[] = [];
  for (let t = start; t <= end; t += DAY_MS) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** "12 Sep" — compact, for the holiday list. */
export function shortDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

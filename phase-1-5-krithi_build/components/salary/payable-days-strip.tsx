import { ArrowRight, CalendarCheck } from "lucide-react";
import Link from "next/link";

import type { PayableDays } from "@/lib/payroll";

/**
 * Innovation 4 — the payable-days strip.
 *
 * Every figure here is read from v_payable_days. Nothing on this strip is
 * computed in the component, and that is the entire claim it makes: the number
 * you are looking at was produced by a check-in and a leave approval, not by
 * payroll code. The chain is
 *
 *   attendance_punches  ->  v_daily_attendance  ->  v_payable_days  ->  here
 *                             ^ approved leave joins in at this step
 *
 * so approving one unpaid day in Time Off moves this number with nothing written
 * in between. It is the moment the four modules are visibly one system.
 */
export function PayableDaysStrip({
  payable,
  month,
}: {
  payable: PayableDays | null;
  /** e.g. "August 2026" — the window v_daily_attendance currently spans. */
  month: string;
}) {
  if (!payable) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        No attendance yet this month, so there are no payable days to show.
      </div>
    );
  }

  const { workingDays, absentDays, unpaidDays, payableDays, lostDays } = payable;

  // Only name the reasons that actually apply — "0 unpaid leave" reads as noise
  // and makes the line longer than the fact it carries.
  const reasons: string[] = [];
  if (absentDays > 0) reasons.push(`${plural(absentDays, "absent day")}`);
  if (unpaidDays > 0) reasons.push(`${plural(unpaidDays, "day")} unpaid leave`);
  const halfDays = round2(lostDays - absentDays - unpaidDays);
  if (halfDays > 0) reasons.push(`${plural(halfDays / 0.5, "half day")}`);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <CalendarCheck className="size-4 shrink-0 self-center text-muted-foreground" aria-hidden />
        <p className="text-sm text-foreground">
          <span className="font-mono text-base font-semibold tabular-nums">
            {formatDays(payableDays)}
          </span>
          <span className="text-muted-foreground"> of </span>
          <span className="font-mono text-base font-semibold tabular-nums">
            {formatDays(workingDays)}
          </span>
          <span className="text-muted-foreground"> working days payable</span>
          {reasons.length > 0 && (
            <>
              <span className="text-muted-foreground"> · </span>
              <span className="text-muted-foreground">{reasons.join(", ")}</span>
            </>
          )}
        </p>
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
        <span>
          {month}, derived from punches and approved leave by{" "}
          <code className="font-mono">v_payable_days</code>. Nothing here is stored.
        </span>
        <Link
          href="/attendance"
          className="inline-flex items-center gap-0.5 underline-offset-2 hover:text-foreground hover:underline"
        >
          See the days
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </p>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDays(n: number): string {
  return Number.isInteger(n) ? String(n) : String(round2(n));
}

function plural(count: number, noun: string): string {
  const n = formatDays(count);
  return `${n} ${noun}${count === 1 ? "" : "s"}`;
}

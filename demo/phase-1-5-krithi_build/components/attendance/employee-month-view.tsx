import { CalendarOff } from "lucide-react";

import { RegularizeForm } from "@/components/attendance/regularize-form";
import { StatusPill } from "@/components/attendance/status-pill";
import { PeriodStepper } from "@/components/attendance/period-stepper";
import { addMonths, formatHours, monthLabel, timeIST, type MonthAttendance } from "@/lib/attendance";
import { cn } from "@/lib/utils";

const MONO = "font-mono tabular-nums";
const PRESENT_GREEN = "#1F8A5F";
const MISSING_AMBER = "#B8791C";

/**
 * Employee month view. Every cell comes from v_daily_attendance — this
 * component formats, it does not decide.
 */
export function EmployeeMonthView({
  data,
  canRegularize,
}: {
  data: MonthAttendance;
  canRegularize: boolean;
}) {
  const { monthStart, rows, summary, outsideViewRange } = data;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodStepper
          mode="month"
          value={monthStart.slice(0, 7)}
          label={monthLabel(monthStart)}
          prev={addMonths(monthStart, -1)}
          next={addMonths(monthStart, 1)}
        />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tile label="Days present" value={String(summary.daysPresent)} />
        <Tile label="Leaves" value={String(summary.leaveDays)} />
        <Tile label="Total working days" value={String(summary.workingDays)} />
      </dl>

      {rows.length === 0 ? (
        <EmptyMonth outsideViewRange={outsideViewRange} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <Th>Date</Th>
                <Th>Status</Th>
                <Th align="right">Check in</Th>
                <Th align="right">Check out</Th>
                <Th align="right">Work hours</Th>
                <Th align="right">Extra hours</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const dim = row.status === "weekoff" || row.status === "holiday";
                return (
                  <tr
                    key={row.day}
                    className={cn("border-b border-border/60 last:border-0", dim && "bg-muted/20")}
                  >
                    <Td className={MONO}>{row.day.slice(8)}/{row.day.slice(5, 7)}</Td>
                    <Td>
                      <StatusPill status={row.status} />
                      {row.isRegularized && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          fixed
                        </span>
                      )}
                    </Td>
                    <Td align="right" className={MONO}>
                      {timeIST(row.checkIn) ?? <Dash dim={dim} />}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.missingCheckout ? (
                        // Amber, not blank: in this system a missing check-out
                        // costs payable days, so it must look like a problem.
                        <span style={{ color: MISSING_AMBER }} title="Missing check-out">
                          —
                        </span>
                      ) : (
                        timeIST(row.checkOut) ?? <Dash dim={dim} />
                      )}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.workHours > 0 ? formatHours(row.workHours) : <Dash dim={dim} />}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.extraHours > 0 ? (
                        <span style={{ color: PRESENT_GREEN }}>+{formatHours(row.extraHours)}</span>
                      ) : (
                        <Dash dim={dim} />
                      )}
                    </Td>
                    <Td align="right">
                      {row.missingCheckout && canRegularize && row.punchId && (
                        <RegularizeForm punchId={row.punchId} day={row.day} />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Attendance is the basis for payslip generation. Unpaid leave and missing attendance reduce
        payable days.
      </p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function EmptyMonth({ outsideViewRange }: { outsideViewRange: boolean }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <CalendarOff className="size-7 text-muted-foreground/50" aria-hidden />
      <h3 className="mt-3 text-sm font-medium text-foreground">Nothing recorded for this month</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {outsideViewRange
          ? "v_daily_attendance builds its day spine for the current month only, so earlier months read as empty until the view is widened."
          : "No punches, holidays or leave land in this month yet."}
      </p>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-2 text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground",
        align === "right" && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className,
}: {
  children?: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-3 py-2 text-foreground",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

function Dash({ dim }: { dim?: boolean }) {
  return <span className={dim ? "text-muted-foreground/30" : "text-muted-foreground/50"}>—</span>;
}

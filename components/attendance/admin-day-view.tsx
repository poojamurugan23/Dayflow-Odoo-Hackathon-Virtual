"use client";

import { useMemo, useState } from "react";
import { CalendarOff, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { RegularizeForm } from "@/components/attendance/regularize-form";
import { StatusPill } from "@/components/attendance/status-pill";
import { PeriodStepper } from "@/components/attendance/period-stepper";
import { initials } from "@/lib/display";
import { cn } from "@/lib/utils";

const MONO = "font-mono tabular-nums";

/** Serialisable shape — the server view rows, pre-formatted for display. */
export type DayPersonRow = {
  profileId: string;
  fullName: string;
  jobPosition: string | null;
  avatarUrl: string | null;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
  extraHours: string | null;
  status: "present" | "absent" | "half_day" | "leave" | "weekoff" | "holiday";
  missingCheckout: boolean;
  punchId: string | null;
  isRegularized: boolean;
};

/**
 * Admin/HR day view. Client-side only so the name filter does not round-trip
 * per keystroke; the rows themselves are read from v_daily_attendance on the
 * server and passed in already formatted.
 */
export function AdminDayView({
  day,
  dayLabel,
  prevDay,
  nextDay,
  rows,
}: {
  day: string;
  dayLabel: string;
  prevDay: string;
  nextDay: string;
  rows: DayPersonRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.fullName.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <PeriodStepper mode="day" value={day} label={dayLabel} prev={prevDay} next={nextDay} />

        <div className="relative ml-auto min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employee"
            aria-label="Search attendance by employee name"
            className="pl-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty />
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Nobody matches “{query.trim()}” — try part of a name or a job position.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <Th>Employee</Th>
                <Th>Status</Th>
                <Th align="right">Check in</Th>
                <Th align="right">Check out</Th>
                <Th align="right">Work hours</Th>
                <Th align="right">Extra hours</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => {
                const dim = row.status === "weekoff" || row.status === "holiday";
                return (
                  <tr
                    // Keyed with the index as well as the id: before migration
                    // 0004, v_daily_attendance can return two rows for one
                    // person on a day with two punches, and a bare id key makes
                    // React throw a duplicate-key error on top of the bad data.
                    key={`${row.profileId}-${index}`}
                    className={cn("border-b border-border/60 last:border-0", dim && "bg-muted/20")}
                  >
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
                          <AvatarFallback className="text-[10px]">
                            {initials(row.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">
                            {row.fullName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {row.jobPosition ?? "—"}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={row.status} />
                      {row.isRegularized && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          fixed
                        </span>
                      )}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.checkIn ?? <Dash dim={dim} />}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.missingCheckout ? (
                        <span className="text-status-absent" title="Missing check-out">
                          —
                        </span>
                      ) : (
                        row.checkOut ?? <Dash dim={dim} />
                      )}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.workHours ?? <Dash dim={dim} />}
                    </Td>
                    <Td align="right" className={MONO}>
                      {row.extraHours ? (
                        <span className="text-status-present">+{row.extraHours}</span>
                      ) : (
                        <Dash dim={dim} />
                      )}
                    </Td>
                    <Td align="right">
                      {row.missingCheckout && row.punchId && (
                        <RegularizeForm punchId={row.punchId} day={day} />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <CalendarOff className="size-7 text-muted-foreground/50" aria-hidden />
      <h3 className="mt-3 text-sm font-medium text-foreground">No attendance for this day</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        v_daily_attendance covers the current month up to today, so dates outside that read as empty.
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
        "px-3 py-2 text-foreground",
        align === "right" && "whitespace-nowrap text-right",
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

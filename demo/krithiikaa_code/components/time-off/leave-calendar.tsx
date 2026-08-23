import { CalendarDays } from "lucide-react";

import type { CalendarDay, HolidayEntry } from "@/lib/leave";
import { monthGrid, monthSequence, shortDate, WEEKDAY_INITIALS } from "@/lib/month-grid";
import { cn } from "@/lib/utils";

/**
 * The employee time-off calendar (wireframe image 7).
 *
 * THREE MONTHS, not a year: current month plus the next two. A full year would
 * be twelve grids of mostly-empty cells, and the thing an employee is actually
 * doing here is checking the leave they have booked and the holidays coming up.
 * Widening it is a one-line change to MONTHS_SHOWN if that turns out to be wrong.
 *
 * Server-rendered. There is no interaction to hydrate — it is a read of the
 * caller's own leave_requests plus the holidays table — so shipping a client
 * bundle for it would buy nothing.
 *
 * Colour is never the only signal: every marked day carries a title attribute
 * naming the state, pending days are outlined rather than filled, and the legend
 * spells out each mapping.
 */
const MONTHS_SHOWN = 3;

type Marker = {
  className: string;
  label: string;
};

export function LeaveCalendar({
  today,
  leave,
  holidays,
  upcomingHolidays,
}: {
  /** IST today, so "today" matches the rest of the app rather than the server's clock. */
  today: string;
  leave: Map<string, CalendarDay>;
  holidays: Map<string, string>;
  upcomingHolidays: HolidayEntry[];
}) {
  const months = monthSequence(today, MONTHS_SHOWN);

  return (
    <section aria-labelledby="leave-calendar-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
        <h2 id="leave-calendar-heading" className="text-sm font-medium text-foreground">
          Your calendar
        </h2>
        <span className="text-xs text-muted-foreground">next {MONTHS_SHOWN} months</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((monthStart) => (
            <MonthCard
              key={monthStart}
              monthStart={monthStart}
              today={today}
              leave={leave}
              holidays={holidays}
            />
          ))}
        </div>

        <Legend upcomingHolidays={upcomingHolidays} />
      </div>
    </section>
  );
}

function MonthCard({
  monthStart,
  today,
  leave,
  holidays,
}: {
  monthStart: string;
  today: string;
  leave: Map<string, CalendarDay>;
  holidays: Map<string, string>;
}) {
  const grid = monthGrid(monthStart);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-foreground">{grid.label}</p>

      <div className="grid grid-cols-7 gap-y-1" role="presentation">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span
            key={`${initial}-${index}`}
            aria-hidden
            className="text-center font-mono text-[10px] text-muted-foreground/70"
          >
            {initial}
          </span>
        ))}

        {grid.cells.map((cell, index) => {
          if (!cell.day) return <span key={`blank-${index}`} aria-hidden />;

          const marker = markerFor(cell.day, cell.isWeekend, leave, holidays);
          const isToday = cell.day === today;

          return (
            <span key={cell.day} className="flex items-center justify-center">
              <span
                title={marker ? `${cell.dayOfMonth}: ${marker.label}` : undefined}
                aria-label={marker ? `${cell.dayOfMonth}, ${marker.label}` : undefined}
                role={marker ? "img" : undefined}
                className={cn(
                  "flex size-6 items-center justify-center rounded-md font-mono text-[11px] tabular-nums transition-colors",
                  marker?.className ??
                    (cell.isWeekend ? "text-muted-foreground/40" : "text-foreground"),
                  // Today gets a ring rather than a fill, so it can coexist with
                  // a leave colour on the same cell.
                  isToday && "ring-1 ring-inset ring-foreground/40 font-semibold",
                )}
              >
                {cell.dayOfMonth}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Precedence matters and mirrors v_daily_attendance's CASE order: a holiday or
 * weekend is not leave, so it wins. Otherwise an employee who booked leave over
 * a long weekend would see the whole block filled as leave they had paid for,
 * while attendance reported those days as holiday — the two screens disagreeing
 * about the same day.
 */
function markerFor(
  day: string,
  isWeekend: boolean,
  leave: Map<string, CalendarDay>,
  holidays: Map<string, string>,
): Marker | null {
  const holidayName = holidays.get(day);
  if (holidayName) {
    return { className: "bg-holiday-soft text-holiday-ink font-medium", label: holidayName };
  }
  if (isWeekend) return null;

  const entry = leave.get(day);
  if (!entry) return null;

  if (entry.status === "pending") {
    // Outlined, not filled — it has not been granted yet.
    return {
      className: "border border-dashed border-foreground/40 text-foreground",
      label: `${typeName(entry.typeCode)}, pending`,
    };
  }

  switch (entry.typeCode) {
    case "sick":
      return { className: "bg-status-leave text-white font-medium", label: "Sick leave, approved" };
    case "unpaid":
      return { className: "bg-status-absent text-white font-medium", label: "Unpaid leave, approved" };
    default:
      return { className: "bg-status-present text-white font-medium", label: "Paid leave, approved" };
  }
}

function typeName(code: string): string {
  if (code === "sick") return "Sick leave";
  if (code === "unpaid") return "Unpaid leave";
  return "Paid leave";
}

function Legend({ upcomingHolidays }: { upcomingHolidays: HolidayEntry[] }) {
  const items = [
    { swatch: "bg-status-present", label: "Paid leave" },
    { swatch: "bg-status-leave", label: "Sick leave" },
    { swatch: "bg-status-absent", label: "Unpaid leave" },
    { swatch: "border border-dashed border-foreground/40", label: "Pending approval" },
    { swatch: "bg-holiday-soft", label: "Public holiday" },
    { swatch: "bg-muted", label: "Weekend" },
  ];

  return (
    <aside className="w-full space-y-4 rounded-xl border border-border bg-card p-4 lg:w-56">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Legend
        </h3>
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs text-foreground">
              <span aria-hidden className={cn("size-3 shrink-0 rounded", item.swatch)} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Upcoming holidays
        </h3>
        {upcomingHolidays.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No holidays left on the calendar this year.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {upcomingHolidays.map((holiday) => (
              <li key={holiday.date} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-foreground">{holiday.name}</span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {shortDate(holiday.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

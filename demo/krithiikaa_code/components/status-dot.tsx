import { Plane } from "lucide-react";

import { statusLabel, type DayStatus } from "@/lib/display";
import { cn } from "@/lib/utils";

/**
 * Today's attendance state for one person, from v_daily_attendance.
 *
 * Colour never carries the meaning on its own: every state also has a
 * title/aria-label, and `leave` additionally uses an airplane glyph, so the
 * three main states stay distinguishable without colour vision.
 *
 * These three hex values are the functional palette from the brand guidelines
 * and are intentionally hard-coded rather than themed — they mean "present",
 * "on leave" and "absent", not "primary" or "accent", so they must not shift
 * when Phase 6 restyles the palette.
 */


/*
 * Live magenta is --status-live, applied as `bg-status-live`. It is the only
 * magenta in the product, which is what makes it read as "this is happening"
 * rather than decoration.
 */

export function StatusDot({
  status,
  live = false,
  className,
}: {
  status: DayStatus | undefined;
  /** True while this person has an open punch — overrides the derived status. */
  live?: boolean;
  className?: string;
}) {
  const label = live ? "Checked in now" : statusLabel(status);

  // Live wins over the derived status: mid-session the day has not resolved to
  // present or half-day yet, and "in the office right now" is the more useful
  // fact. It settles to the derived colour on check out.
  if (live) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cn(
          "block size-2.5 rounded-full bg-status-live ring-2 ring-card transition-colors duration-200 motion-safe:animate-pulse",
          className,
        )}
      />
    );
  }

  if (status === "leave") {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cn("flex size-4 items-center justify-center", className)}
      >
        <Plane className="size-4 -rotate-12 text-status-leave" aria-hidden />
      </span>
    );
  }

  // weekoff / holiday / unknown are muted: nobody is expected in, so a green or
  // amber dot would read as a judgement that isn't being made.
  const neutral = status === undefined || status === "weekoff" || status === "holiday";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "block size-2.5 rounded-full ring-2 ring-card transition-colors duration-200",
        neutral ? "bg-muted-foreground/40" : dotClass(status),
        className,
      )}
    />
  );
}

function dotClass(status: DayStatus): string {
  switch (status) {
    case "present":
      return "bg-status-present";
    case "half_day":
      // Half a day worked is still attendance, so it stays in the present
      // family rather than being flagged amber like an unexplained absence.
      return "bg-status-present";
    default:
      return "bg-status-absent";
  }
}

/** Dot plus its written state, for places with room for the label. */
export function StatusBadge({
  status,
  live = false,
}: {
  status: DayStatus | undefined;
  live?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <StatusDot status={status} live={live} />
      {live ? "Checked in now" : statusLabel(status)}
    </span>
  );
}

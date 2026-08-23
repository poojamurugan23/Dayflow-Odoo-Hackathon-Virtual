import { Clock } from "lucide-react";

/**
 * Placeholder for the check-in systray.
 *
 * Phase 3 turns this into a live control: idle shows "Check In", active shows a
 * running timer sourced from attendance_punches. It is deliberately inert here
 * — disabled and marked as such — rather than a button that looks real and does
 * nothing.
 */
export function SystrayCheckIn() {
  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground sm:flex"
      title="Check in/out arrives in Phase 3"
    >
      <Clock className="size-3.5" aria-hidden />
      <span>Check In</span>
      <span className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px] uppercase tracking-wide">
        soon
      </span>
    </div>
  );
}

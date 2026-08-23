import { leaveStatusLabel, type LeaveStatus } from "@/lib/leave-days";
import { cn } from "@/lib/utils";

/**
 * Request status. Three states, three colours — and the colour is never the
 * only signal: the word is always there. Approved reuses the functional green
 * and rejected the destructive red from the theme; pending is deliberately
 * grey, because "waiting" is not a judgement.
 */
export function LeaveStatusPill({ status }: { status: LeaveStatus }) {
  const tone: Record<LeaveStatus, string> = {
    pending: "border-border text-muted-foreground",
    approved: "border-[#1F8A5F55] text-[#1F8A5F]",
    rejected: "border-destructive/40 text-destructive",
    cancelled: "border-border text-muted-foreground/60 line-through",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tone[status],
      )}
    >
      {leaveStatusLabel(status)}
    </span>
  );
}

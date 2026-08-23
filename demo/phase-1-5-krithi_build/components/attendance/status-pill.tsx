import { statusLabel, type DayStatus } from "@/lib/display";
import { cn } from "@/lib/utils";

/**
 * The day's derived status, rendered as words. Weekoff and holiday are
 * deliberately muted rather than amber — nobody was expected in, so flagging
 * them like an unexplained absence would be wrong.
 */
export function StatusPill({ status }: { status: DayStatus }) {
  const tone: Record<DayStatus, string> = {
    present: "text-[#1F8A5F]",
    half_day: "text-[#1F8A5F]",
    leave: "text-[#3E6FA8]",
    absent: "text-[#B8791C]",
    weekoff: "text-muted-foreground/60",
    holiday: "text-muted-foreground/60",
  };

  return (
    <span className={cn("whitespace-nowrap text-xs", tone[status])}>{statusLabel(status)}</span>
  );
}

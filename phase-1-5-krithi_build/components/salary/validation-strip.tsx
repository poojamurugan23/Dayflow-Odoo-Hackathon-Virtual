import { CircleAlert, CircleCheck } from "lucide-react";

import { formatINR } from "@/lib/salary";
import { cn } from "@/lib/utils";

/**
 * The wireframe's "total should not exceed the defined wage" check.
 *
 * Green when the components total the wage exactly; red when they exceed it.
 * These two hexes are the functional palette — the same green as `present` in
 * attendance — and are intentionally hard-coded so Phase 6's restyle cannot
 * turn "balanced" into a decorative colour.
 *
 * With the remainder rule this can only read green, which is the point: the
 * strip is proof that the rules balance, and it would go red immediately if
 * someone replaced the remainder with the wireframe's literal 11.67%.
 */
const BALANCED = "#1F8A5F";
const EXCEEDS = "#C0392B";

export function ValidationStrip({ total, wage }: { total: number; wage: number }) {
  // Compared in paise. Two floats that both display as 50,000.00 can still
  // differ by 1e-10, and a strip that reads red on a rounding artifact is worse
  // than no strip at all.
  const totalPaise = Math.round(total * 100);
  const wagePaise = Math.round(wage * 100);

  const exceeds = totalPaise > wagePaise;
  const short = totalPaise < wagePaise;
  const balanced = !exceeds && !short;
  const colour = balanced ? BALANCED : EXCEEDS;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-4 py-2.5 text-sm",
      )}
      style={{ borderColor: `${colour}55`, backgroundColor: `${colour}0D` }}
    >
      {balanced ? (
        <CircleCheck className="size-4 shrink-0" style={{ color: colour }} aria-hidden />
      ) : (
        <CircleAlert className="size-4 shrink-0" style={{ color: colour }} aria-hidden />
      )}

      <span className="text-muted-foreground">Total components</span>
      <span className="font-mono text-sm font-medium tabular-nums" style={{ color: colour }}>
        ₹{formatINR(total)} / ₹{formatINR(wage)}
      </span>

      <span className="text-xs" style={{ color: colour }}>
        {balanced && "balances exactly"}
        {exceeds && `exceeds the wage by ₹${formatINR((totalPaise - wagePaise) / 100)}`}
        {short && `₹${formatINR((wagePaise - totalPaise) / 100)} unallocated`}
      </span>
    </div>
  );
}

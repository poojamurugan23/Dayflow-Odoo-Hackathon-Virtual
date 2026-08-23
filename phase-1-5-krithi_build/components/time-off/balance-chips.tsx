import { formatDays } from "@/lib/leave-days";

export type BalanceChip = {
  leaveType: string;
  allocated: number;
  used: number;
  available: number;
};

/**
 * Balance chips, straight from v_leave_balance.
 *
 * Every number here is `allocated - sum(approved)` computed by the view at read
 * time. Nothing is stored and nothing is decremented, which is why an approval
 * on the admin screen moves these figures with no code in between.
 */
export function BalanceChips({ balances }: { balances: BalanceChip[] }) {
  if (balances.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No leave allocated for you yet. HR sets this up per year.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {balances.map((balance) => (
        <div
          key={balance.leaveType}
          className="min-w-[9.5rem] rounded-xl border border-border bg-card px-4 py-3"
        >
          <p className="text-xs text-muted-foreground">{balance.leaveType}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
            {formatDays(balance.available)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">days available</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {formatDays(balance.used)} used of {formatDays(balance.allocated)}
          </p>
        </div>
      ))}
    </div>
  );
}

/** The admin equivalent: one number that says whether there is work to do. */
export function PendingChip({ count }: { count: number }) {
  return (
    <div className="min-w-[9.5rem] rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">Awaiting your decision</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
        {count}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          pending request{count === 1 ? "" : "s"}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {count === 0 ? "Queue is clear." : "Across the organisation."}
      </p>
    </div>
  );
}

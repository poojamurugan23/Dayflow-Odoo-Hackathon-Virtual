import { formatDays } from "@/lib/leave-days";
import type { AllocationRow } from "@/lib/leave";

/**
 * Who has what balance. Read-only, on purpose.
 *
 * Editing allocations is a yearly HR admin task rather than part of the
 * request-and-approve loop, and every number here is derived by
 * v_leave_balance — so this is a report, not a form. Allocations themselves are
 * created with the employee (24 paid, 7 sick) in actions/employees.ts.
 */
export function AllocationList({ rows }: { rows: AllocationRow[] }) {
  const types = [...new Set(rows.flatMap((r) => r.balances.map((b) => b.leaveType)))].sort();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Available = allocated − approved, computed by <code className="font-mono">v_leave_balance</code>{" "}
        on read. Nothing here is stored, so an approval moves these figures immediately.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th scope="col" className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Employee
              </th>
              <th scope="col" className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Department
              </th>
              {types.map((type) => (
                <th
                  key={type}
                  scope="col"
                  className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.profileId} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5">
                  <span className="block font-medium text-foreground">{row.fullName}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {row.loginId}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {row.department ?? "—"}
                </td>
                {types.map((type) => {
                  const balance = row.balances.find((b) => b.leaveType === type);
                  return (
                    <td key={type} className="px-3 py-2.5 text-right font-mono text-xs">
                      {balance ? (
                        <>
                          <span className="text-foreground">{formatDays(balance.available)}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {formatDays(balance.allocated)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

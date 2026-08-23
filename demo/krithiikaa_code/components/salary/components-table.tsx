import { COMPONENT_NOTES, ruleLabel, type ComputedComponent } from "@/lib/salary";
import { TweenedAmount } from "@/components/salary/tweened-amount";

/**
 * The six components, per the wireframe: name, what it is for, the rule, and the
 * amount.
 *
 * Amounts are Plex Mono with tabular-nums and right-aligned in a fixed column so
 * the decimal points line up down the table and nothing shifts when the wage
 * changes. That is the only reason a monospace font is used here — a money
 * column that jitters is unreadable.
 */
export function ComponentsTable({
  components,
  animate,
}: {
  components: ComputedComponent[];
  /** Tween amounts on change. Only true where a wage can actually be edited. */
  animate: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th scope="col" className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Component
            </th>
            <th scope="col" className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Rule
            </th>
            <th scope="col" className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5">
                <span className="block font-medium text-foreground">{component.name}</span>
                {COMPONENT_NOTES[component.name] && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {COMPONENT_NOTES[component.name]}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                {ruleLabel(component)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-sm text-foreground tabular-nums">
                <span className="text-muted-foreground">₹</span>
                {animate ? (
                  <TweenedAmount value={component.amount} />
                ) : (
                  formatFixed(component.amount)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatFixed(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

import { formatINR, type Deductions, type StatutoryConfig } from "@/lib/salary";
import { TweenedAmount } from "@/components/salary/tweened-amount";

/**
 * Statutory deductions, from statutory_config — not hard-coded percentages.
 *
 * PF is a percentage of BASIC rather than of the whole wage, which is why Basic
 * anchors the entire structure. The employer's contribution is shown because it
 * is part of the cost of employing someone, but it is deliberately excluded from
 * the net figure: it is not withheld from the employee.
 */
export function DeductionsPanel({
  deductions,
  config,
  animate,
}: {
  deductions: Deductions;
  config: StatutoryConfig;
  animate: boolean;
}) {
  const rows = [
    {
      label: "Provident Fund — employee",
      rule: `${config.pfEmployeePct}% of basic`,
      amount: deductions.pfEmployee,
      withheld: true,
    },
    {
      label: "Provident Fund — employer",
      rule: `${config.pfEmployerPct}% of basic`,
      amount: deductions.pfEmployer,
      withheld: false,
    },
    {
      label: "Professional Tax",
      rule: "flat, per state",
      amount: deductions.professionalTax,
      withheld: true,
    },
  ];

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Statutory deductions
        </h3>
      </div>

      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-3 px-4 py-2.5">
            <dt className="min-w-0 flex-1">
              <span className="block text-sm text-foreground">{row.label}</span>
              <span className="block font-mono text-[11px] text-muted-foreground tabular-nums">
                {row.rule}
                {!row.withheld && " · company cost, not withheld"}
              </span>
            </dt>
            <dd className="whitespace-nowrap font-mono text-sm tabular-nums text-foreground">
              <span className="text-muted-foreground">₹</span>
              {animate ? <TweenedAmount value={row.amount} /> : formatINR(row.amount)}
            </dd>
          </div>
        ))}

        {/* Derived, and labelled as such. A deductions panel that stops before
            the resulting figure leaves the obvious question unanswered, but this
            is arithmetic on the rows above — not a payslip. */}
        <div className="flex items-baseline gap-3 bg-muted/30 px-4 py-2.5">
          <dt className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Net in hand</span>
            <span className="block font-mono text-[11px] text-muted-foreground tabular-nums">
              wage − employee PF − professional tax
            </span>
          </dt>
          <dd className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">
            <span className="text-muted-foreground">₹</span>
            {animate ? <TweenedAmount value={deductions.netInHand} /> : formatINR(deductions.netInHand)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

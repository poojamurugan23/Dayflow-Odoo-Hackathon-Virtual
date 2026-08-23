/**
 * Salary component rules — the single definition of how a monthly wage is
 * broken down. Pure: nothing here may import a server module, because the
 * Salary Info tab recomputes every component in the browser as an admin types a
 * new wage, and the server action recomputes the same figures before writing.
 * One algorithm, two callers, no drift.
 *
 * ---------------------------------------------------------------------------
 * Two wireframe discrepancies, both resolved the same way: make the total
 * balance exactly.
 *
 *   Fixed Allowance. The wireframe prints 2,918 — which is 11.67% of Basic on a
 *   50,000 wage. But wage - sum(others) = 4,167.50. Master plan Part 2 says use
 *   the remainder, so the validation strip reads 50,000.00 / 50,000.00 rather
 *   than being 1,250 short.
 *
 *   Standard Allowance. The Phase 5 brief says "16.67% of wage". That cannot be
 *   right: 16.67% of 50,000 is 8,335, which makes the five named components sum
 *   to exactly the wage and leaves Fixed Allowance at zero — contradicting the
 *   same brief's 4,168 target and the master plan's. 16.67% OF BASIC is
 *   4,167.50, which leaves Fixed at 4,167.50 ≈ the 4,168 both documents state.
 *   The wireframe's own Fixed figure confirms the base: 2,918 is 11.67% of
 *   Basic, not of wage. So these percentages are all relative to Basic, and
 *   that is what is implemented.
 * ---------------------------------------------------------------------------
 */

export type ComputationType = "pct_of_wage" | "pct_of_basic" | "fixed" | "remainder";

export type ComponentRule = {
  name: string;
  computationType: ComputationType;
  /** Percentage for the pct_* types; null for `remainder`. */
  value: number | null;
  sortOrder: number;
};

export const SALARY_COMPONENTS: readonly ComponentRule[] = [
  { name: "Basic Salary", computationType: "pct_of_wage", value: 50, sortOrder: 1 },
  { name: "House Rent Allowance", computationType: "pct_of_basic", value: 50, sortOrder: 2 },
  { name: "Standard Allowance", computationType: "pct_of_basic", value: 16.67, sortOrder: 3 },
  { name: "Performance Bonus", computationType: "pct_of_basic", value: 8.33, sortOrder: 4 },
  { name: "Leave Travel Allowance", computationType: "pct_of_basic", value: 8.33, sortOrder: 5 },
  { name: "Fixed Allowance", computationType: "remainder", value: null, sortOrder: 6 },
];

export type ComputedComponent = ComponentRule & { amount: number };

/** Money is rounded to paise everywhere. Never trust an unrounded float total. */
export function toPaise(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Resolve a set of rules against a monthly wage.
 *
 * The rules come from the DATABASE, not from the constant above: `salary_components`
 * stores computation_type and value per structure, so a structure created under
 * different rules still renders the figures it was created with. The constant is
 * only the default for a new employee.
 *
 * The remainder absorbs all rounding drift, so `sum(amounts) === wage` exactly —
 * which is the whole point of the validation strip.
 */
export function computeFromRules(
  monthlyWage: number,
  rules: readonly ComponentRule[],
): ComputedComponent[] {
  const wage = toPaise(Number.isFinite(monthlyWage) ? monthlyWage : 0);

  // Basic anchors the pct_of_basic rules, so it is resolved first and from the
  // rules rather than assumed to be 50%.
  const basicRule = rules.find((r) => r.name.toLowerCase().startsWith("basic"));
  const basic =
    basicRule?.computationType === "pct_of_wage"
      ? toPaise((wage * (basicRule.value ?? 0)) / 100)
      : toPaise((wage * 50) / 100);

  const resolved = rules.map((rule): ComputedComponent => {
    switch (rule.computationType) {
      case "pct_of_wage":
        return { ...rule, amount: toPaise((wage * (rule.value ?? 0)) / 100) };
      case "pct_of_basic":
        return { ...rule, amount: toPaise((basic * (rule.value ?? 0)) / 100) };
      case "fixed":
        return { ...rule, amount: toPaise(rule.value ?? 0) };
      case "remainder":
        // Filled in below, once everything else is known.
        return { ...rule, amount: 0 };
    }
  });

  const allocated = resolved
    .filter((c) => c.computationType !== "remainder")
    .reduce((sum, c) => sum + c.amount, 0);

  const remainderCount = resolved.filter((c) => c.computationType === "remainder").length;
  // More than one remainder would be ambiguous; splitting it evenly is the only
  // answer that still totals the wage.
  const perRemainder = remainderCount > 0 ? toPaise((wage - toPaise(allocated)) / remainderCount) : 0;

  const out = resolved.map((c) =>
    c.computationType === "remainder" ? { ...c, amount: perRemainder } : c,
  );

  // Belt and braces: hand any last paise of drift to the final remainder so the
  // total is exactly the wage even if perRemainder rounded.
  const drift = toPaise(wage - out.reduce((sum, c) => sum + c.amount, 0));
  if (drift !== 0) {
    for (let i = out.length - 1; i >= 0; i -= 1) {
      if (out[i].computationType === "remainder") {
        out[i] = { ...out[i], amount: toPaise(out[i].amount + drift) };
        break;
      }
    }
  }

  return [...out].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** The default breakdown for a new employee. */
export function computeComponents(monthlyWage: number): ComputedComponent[] {
  return computeFromRules(monthlyWage, SALARY_COMPONENTS);
}

export function componentsTotal(components: ComputedComponent[]): number {
  return toPaise(components.reduce((sum, c) => sum + c.amount, 0));
}

// ---------------------------------------------------------------------------
// Deductions — statutory, from statutory_config
// ---------------------------------------------------------------------------
export type StatutoryConfig = {
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
};

export type Deductions = {
  basic: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  /** What the employee has withheld: their PF share plus professional tax. */
  totalEmployee: number;
  /** Wage minus the employee's deductions. The employer's PF is a cost to the
   *  company, not a deduction from the employee, so it is excluded here. */
  netInHand: number;
};

/**
 * PF is a percentage of BASIC, not of the whole wage — that is the statutory
 * definition and the reason Basic anchors the whole structure.
 */
export function computeDeductions(
  components: ComputedComponent[],
  wage: number,
  config: StatutoryConfig,
): Deductions {
  const basic = components.find((c) => c.name.toLowerCase().startsWith("basic"))?.amount ?? 0;
  const pfEmployee = toPaise((basic * config.pfEmployeePct) / 100);
  const pfEmployer = toPaise((basic * config.pfEmployerPct) / 100);
  const professionalTax = toPaise(config.professionalTax);
  const totalEmployee = toPaise(pfEmployee + professionalTax);

  return {
    basic,
    pfEmployee,
    pfEmployer,
    professionalTax,
    totalEmployee,
    netInHand: toPaise(toPaise(wage) - totalEmployee),
  };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** How a component is derived, in words, for the table's percentage column. */
export function ruleLabel(rule: ComponentRule): string {
  switch (rule.computationType) {
    case "pct_of_wage":
      return `${formatPct(rule.value)}% of wage`;
    case "pct_of_basic":
      return `${formatPct(rule.value)}% of basic`;
    case "fixed":
      return "fixed amount";
    case "remainder":
      return "remainder";
  }
}

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}

/** One line on what each component is for. Keyed by name so a structure created
 *  with custom components still renders, just without a description. */
export const COMPONENT_NOTES: Record<string, string> = {
  "Basic Salary": "Anchors every allowance below, and PF is a percentage of it.",
  "House Rent Allowance": "Rent support; partly tax-exempt against actual rent paid.",
  "Standard Allowance": "Flat allowance in place of itemised expense claims.",
  "Performance Bonus": "Paid against performance; part of fixed CTC here.",
  "Leave Travel Allowance": "Travel costs, claimable against tickets.",
  "Fixed Allowance": "The balancing figure, so components total the wage exactly.",
};

/** Indian-format currency for display, e.g. 50,000.00 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Yearly wage. Stated as a function because the wireframe shows both. */
export function yearlyWage(monthlyWage: number): number {
  return toPaise(monthlyWage * 12);
}

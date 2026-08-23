/**
 * Salary component rules — the single definition of how a monthly wage is
 * broken down. Phase 2 uses this when HR creates an employee; Phase 5's Salary
 * Info tab will read the same table rather than restating the maths.
 *
 * Master plan Part 2, "Wireframe discrepancy to resolve": the wireframe shows
 * Fixed Allowance at 2,918 (11.67%), but wage - sum(others) = 4,168 for a
 * 50,000 wage. The remainder rule is used so the components always total
 * exactly the wage and the Phase 5 validation strip balances.
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

/**
 * Resolve the rules against a monthly wage. Amounts are rounded to paise and
 * the remainder absorbs any rounding drift, so the total is exactly the wage.
 */
export function computeComponents(monthlyWage: number): ComputedComponent[] {
  const round = (n: number) => Math.round(n * 100) / 100;
  const basic = round((monthlyWage * 50) / 100);

  const resolved = SALARY_COMPONENTS.map((rule) => {
    if (rule.computationType === "remainder") return { ...rule, amount: 0 };
    if (rule.computationType === "pct_of_wage") {
      return { ...rule, amount: round((monthlyWage * (rule.value ?? 0)) / 100) };
    }
    if (rule.computationType === "pct_of_basic") {
      return { ...rule, amount: round((basic * (rule.value ?? 0)) / 100) };
    }
    return { ...rule, amount: round(rule.value ?? 0) };
  });

  const allocated = resolved
    .filter((c) => c.computationType !== "remainder")
    .reduce((sum, c) => sum + c.amount, 0);

  return resolved.map((c) =>
    c.computationType === "remainder" ? { ...c, amount: round(monthlyWage - allocated) } : c,
  );
}

/** Indian-format currency for display, e.g. 50,000.00 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

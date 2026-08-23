/**
 * Shared validators. Imported by BOTH the server actions and the client
 * indicators, so the rule a user sees is literally the rule that gets
 * enforced — there is no second copy to drift.
 *
 * SRS 3.1.1: "Password must follow security rules."
 * Master plan Part 2: min 8, mixed case, digit.
 */

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "One number", test: (v) => /[0-9]/.test(v) },
];

/** Rules the value currently fails. Empty array means the password is acceptable. */
export function failedPasswordRules(value: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

/**
 * Server-side gate. Returns an error string, or null when the password passes.
 * The client indicator is a convenience; this is the actual check.
 */
export function passwordProblem(value: string): string | null {
  if (!value) return "Enter a password.";
  const failed = failedPasswordRules(value);
  if (failed.length === 0) return null;
  return `Password needs: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`;
}

/** 0-4, for the strength meter. */
export function passwordScore(value: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(value)).length;
}

export function isEmail(value: string): boolean {
  return value.includes("@");
}

/** Trim and collapse whitespace; returns "" for nullish or non-string input. */
export function cleanString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/**
 * Two-letter org code from a company name: "Odoo India" -> "OI",
 * "Precision" -> "PR". Used as the prefix of every login ID in that org.
 */
export function deriveOrgCode(companyName: string): string {
  const words = companyName
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) return "XX";
  if (words.length === 1) return words[0].slice(0, 2).padEnd(2, "X");
  return (words[0][0] + words[1][0]).padEnd(2, "X");
}

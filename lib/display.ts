/**
 * Pure presentation helpers and shared unions. NOTHING in this file may import
 * a server module.
 *
 * Why it exists: `initials` and `statusLabel` used to live in lib/auth.ts and
 * lib/attendance.ts alongside their server queries. A client component
 * importing one of those helpers dragged lib/supabase/server.ts — and therefore
 * `next/headers` — into the browser bundle, which fails at runtime while
 * `tsc --noEmit` stays perfectly happy. Keeping the pure helpers separate makes
 * that mistake impossible rather than merely unlikely.
 */

export type UserRole = "admin" | "hr" | "employee";

export type DayStatus = "present" | "absent" | "half_day" | "leave" | "weekoff" | "holiday";

/** "Priya Sharma" -> "PS", for avatar fallbacks. */
export function initials(fullName: string): string {
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function roleLabel(role: UserRole): string {
  if (role === "admin") return "Admin";
  if (role === "hr") return "HR Officer";
  return "Employee";
}

export function statusLabel(status: DayStatus | undefined): string {
  switch (status) {
    case "present":
      return "Present";
    case "half_day":
      return "Half day";
    case "leave":
      return "On leave";
    case "absent":
      return "Absent";
    case "weekoff":
      return "Week off";
    case "holiday":
      return "Holiday";
    default:
      return "No record";
  }
}

/** ISO date -> DD/MM/YYYY, per the design brief. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

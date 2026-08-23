import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ask Postgres for the next login ID, then make sure it is actually free.
 *
 * generate_login_id() derives the serial from a per-year COUNT, which is fine
 * until two people in the same org share initials and a joining year — the
 * count has not moved, so it hands back the same ID twice. login_id is UNIQUE,
 * so the second insert would fail. Bump the trailing serial until it is free.
 *
 * Server-only: requires a service-role client, because `profiles` is not
 * readable across the org by an anonymous or employee-level caller.
 */
export async function allocateLoginId(
  admin: SupabaseClient,
  orgId: string,
  fullName: string,
  joinDate: string,
  orgCode: string,
): Promise<string> {
  const { data } = await admin.rpc("generate_login_id", {
    p_org: orgId,
    p_name: fullName,
    p_join: joinDate,
  });

  let candidate =
    typeof data === "string" && data.length > 0
      ? data
      : `${orgCode}${fullName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${joinDate.slice(0, 4)}0001`;

  for (let attempt = 0; attempt < 50; attempt++) {
    const { data: clash } = await admin
      .from("profiles")
      .select("id")
      .eq("login_id", candidate)
      .maybeSingle();

    if (!clash) return candidate;

    const match = candidate.match(/^(.*)(\d{4})$/);
    if (!match) return `${candidate}${attempt + 1}`;
    candidate = match[1] + String(Number(match[2]) + 1).padStart(4, "0");
  }

  return candidate;
}

/**
 * One-time password handed to the employee. Guarantees at least one uppercase,
 * one lowercase and one digit so it always satisfies the policy in
 * lib/validation.ts, and avoids characters that are ambiguous when read aloud
 * or copied off a screen (O/0, I/l/1).
 */
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

  const chars = [pick(upper), pick(lower), pick(digits), pick(digits)];
  while (chars.length < 12) chars.push(pick(all));

  // Fisher-Yates, so the guaranteed characters are not always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

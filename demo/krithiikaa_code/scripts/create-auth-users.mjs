/**
 * Dayflow — Phase 0 seed, step 1 of 2: create the auth users.
 *
 * Why this is a Node script and not part of seed.sql:
 * `profiles.id` references `auth.users`, so the auth rows must exist first.
 * Hand-inserting into `auth.users` means hand-rolling a bcrypt hash AND a
 * matching `auth.identities` row, and that schema is GoTrue-version specific.
 * Get either wrong and the row looks fine while login silently fails. The
 * admin API is the supported path and always produces a user that can log in.
 *
 * seed.sql then resolves these users by email, so the two halves stay in sync
 * without any UUIDs being copied by hand.
 *
 * Run:  npm run seed:auth
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Fill them into .env.local first — see README.md.",
  );
  process.exit(1);
}

// Service role bypasses RLS. This key must never be imported by app code.
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Dayflow@2026";

/** Must match the email column in supabase/seed.sql exactly. */
const USERS = [
  { email: "priya.sharma@odooindia.example", name: "Priya Sharma" },
  { email: "arjun.nair@odooindia.example", name: "Arjun Nair" },
  { email: "rahul.verma@odooindia.example", name: "Rahul Verma" },
  { email: "sneha.iyer@odooindia.example", name: "Sneha Iyer" },
  { email: "vikram.singh@odooindia.example", name: "Vikram Singh" },
  { email: "meera.krishnan@odooindia.example", name: "Meera Krishnan" },
  { email: "karthik.reddy@odooindia.example", name: "Karthik Reddy" },
];

async function findByEmail(email) {
  // listUsers is paginated; the seed set is small so one page of 200 is plenty.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

let created = 0;
let reset = 0;

for (const { email, name } of USERS) {
  const existing = await findByEmail(email);

  if (existing) {
    // Idempotent re-run: force the password back to the known demo value.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error(`  ✗ ${email} — ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`  ↻ ${email} already existed, password reset`);
    reset++;
    continue;
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true, // pre-confirmed: no mail is sent to the .example domain
    user_metadata: { full_name: name },
  });
  if (error) {
    console.error(`  ✗ ${email} — ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`  ✓ ${email} created`);
  created++;
}

console.log(
  `\n${created} created, ${reset} reset, ${USERS.length} total.\n` +
    `Demo password for every seeded user: ${DEMO_PASSWORD}\n` +
    `Next: run supabase/seed.sql in the Supabase SQL editor.`,
);

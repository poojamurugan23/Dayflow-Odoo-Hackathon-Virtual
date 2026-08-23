/**
 * Verify RLS behaviour against the live project through REAL logged-in sessions.
 *
 * The Supabase SQL editor runs as a superuser and bypasses RLS, so it can tell
 * you a policy exists but never that it works. This signs in as an actual
 * employee and an actual admin and compares what each can read.
 *
 * Master plan Part 11 lists "RLS blocks your own queries" as a live risk and
 * says to test both roles at every checkpoint. Run this at each one.
 *
 * Run:  npm run verify:rls
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = "Dayflow@2026";

const EMPLOYEE = "rahul.verma@odooindia.example";
const ADMIN = "priya.sharma@odooindia.example";

const TABLES = [
  "profiles", "private_info", "salary_structures", "salary_components",
  "audit_log", "organizations", "holidays", "leave_types",
  "attendance_punches", "leave_allocations", "leave_requests",
];
const VIEWS = ["v_daily_attendance", "v_leave_balance", "v_payable_days"];

async function rowCount(client, table) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) return error.code === "42501" || /permission/i.test(error.message) ? "denied" : `ERR ${error.code ?? ""}`;
  return count ?? 0;
}

async function distinctPeople(client, view) {
  const { data, error } = await client.from(view).select("profile_id");
  if (error) return `ERR ${error.code ?? error.message.slice(0, 24)}`;
  return new Set(data.map((r) => r.profile_id)).size;
}

async function signedIn(email) {
  const client = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`could not sign in as ${email}: ${error.message}`);
  return client;
}

const loggedOut = createClient(URL, PUB, { auth: { persistSession: false } });
const employee = await signedIn(EMPLOYEE);
const admin = await signedIn(ADMIN);

const rows = [];
for (const t of TABLES) {
  rows.push([t, await rowCount(loggedOut, t), await rowCount(employee, t), await rowCount(admin, t)]);
}
for (const v of VIEWS) {
  rows.push([`${v} (people)`, await distinctPeople(loggedOut, v), await distinctPeople(employee, v), await distinctPeople(admin, v)]);
}

const w = Math.max(...rows.map((r) => r[0].length), 12);
console.log(`\n${"table / view".padEnd(w)}${"logged out".padStart(12)}${"employee".padStart(11)}${"admin".padStart(9)}`);
console.log("-".repeat(w + 32));
for (const [label, a, e, ad] of rows) {
  console.log(label.padEnd(w) + String(a).padStart(12) + String(e).padStart(11) + String(ad).padStart(9));
}

// The assertions that actually matter.
const salaryEmp = await rowCount(employee, "salary_structures");
const peopleEmp = await distinctPeople(employee, "v_daily_attendance");
const peopleAdm = await distinctPeople(admin, "v_daily_attendance");
const profEmp = await rowCount(employee, "profiles");

const checks = [
  ["employee reads 0 salary rows", salaryEmp === 0],
  ["employee sees only themselves in profiles", profEmp === 1],
  ["employee sees 1 person in v_daily_attendance", peopleEmp === 1],
  ["admin sees all 7 in v_daily_attendance", peopleAdm === 7],
];
console.log("");
let ok = true;
for (const [label, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
  if (!pass) ok = false;
}
process.exit(ok ? 0 : 1);

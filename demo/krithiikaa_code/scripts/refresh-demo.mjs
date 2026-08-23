/**
 * Refresh the demo data for a live walkthrough.  npm run demo:refresh
 *
 * NON-DESTRUCTIVE, unlike supabase/seed.sql. That file deletes every profile and
 * re-inserts a fixed list of seven by matching auth.users on email — which would
 * now silently delete the employees added through the app by hand, leaving their
 * auth users orphaned. It is still the right script for an empty database; it is
 * the wrong one for this database.
 *
 * So this script touches only what a demo needs to look alive:
 *   - attendance punches for the current month, for EVERY active employee
 *   - a clean set of leave requests: approved paid, approved unpaid, one pending
 *   - a few unread notifications
 *
 * It leaves profiles, private_info, salary structures and allocations alone.
 *
 * Written in JS rather than SQL on purpose: it runs with `node --env-file` and
 * needs no database password, so it can be re-run between demo takes without
 * opening the Supabase SQL editor.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const IST = "Asia/Kolkata";
const IST_OFFSET_MIN = 330; // constant, no DST

/** Today in IST as YYYY-MM-DD. */
const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: IST });

/** An IST wall-clock time on a calendar day, as an instant. */
function istAt(day, hours, minutes) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hours, minutes) - IST_OFFSET_MIN * 60_000).toISOString();
}

const isWeekend = (day) => {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
};

function daysOfCurrentMonth(today) {
  const [y, m] = today.split("-").map(Number);
  const last = Number(today.slice(8, 10));
  const out = [];
  for (let d = 1; d <= last; d += 1) {
    out.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return out;
}

const today = todayIST();
const monthStart = `${today.slice(0, 7)}-01`;
console.log(`Refreshing demo data for ${monthStart} .. ${today} (IST)\n`);

// ---------------------------------------------------------------------------
// Who and what
// ---------------------------------------------------------------------------
const { data: people, error: peopleError } = await db
  .from("profiles")
  .select("id, login_id, full_name, role, department")
  .is("exit_date", null)
  .order("login_id");

if (peopleError) {
  console.error("Could not read profiles:", peopleError.message);
  process.exit(1);
}

const { data: holidayRows } = await db.from("holidays").select("date");
const holidays = new Set((holidayRows ?? []).map((h) => h.date));

const { data: types } = await db.from("leave_types").select("id, code");
const typeId = Object.fromEntries((types ?? []).map((t) => [t.code, t.id]));

const admin = people.find((p) => p.role === "admin") ?? people[0];
const byLogin = Object.fromEntries(people.map((p) => [p.login_id, p]));

// The demo cast. Falls back to whoever exists, so the script still works after
// employees are added or renamed rather than throwing on a missing login ID.
const pick = (login, fallbackIndex) =>
  byLogin[login] ?? people.filter((p) => p.id !== admin.id)[fallbackIndex] ?? people[0];

const forgotCheckout = pick("OIARNA20210002", 0); // the Regularize demo
const unpaidLeave = pick("OIKARE20240001", 1);    // reduces payable days
const pendingRequest = pick("OIRAVE20220001", 2); // the live approve demo
const paidLeave = pick("OISNIY20220002", 3);
const sickLeave = pick("OIVISI20230001", 4);
const absentOnce = pick("OIMEKR20230002", 5);

// ---------------------------------------------------------------------------
// 1. Leave requests — written BEFORE punches, so punch generation can skip the
//    days a person is approved off. Attendance and leave must not both claim a
//    day; the view would report `leave` while a punch sat underneath it.
// ---------------------------------------------------------------------------
const weekdays = daysOfCurrentMonth(today).filter((d) => !isWeekend(d) && !holidays.has(d));
if (weekdays.length < 6) {
  console.error("Not enough weekdays elapsed this month to build a demo. Try later in the month.");
  process.exit(1);
}

const at = (n) => weekdays[Math.min(n, weekdays.length - 1)];

const { error: wipeLeave } = await db.from("leave_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (wipeLeave) console.log(`  ! could not clear leave_requests: ${wipeLeave.message}`);

const leaveRows = [
  {
    who: paidLeave, code: "paid", from: at(1), to: at(2), days: 2,
    reason: "Family function in Coimbatore.",
    status: "approved", comment: "Approved. Enjoy!",
  },
  {
    who: unpaidLeave, code: "unpaid", from: at(4), to: at(4), days: 1,
    reason: "Personal errand, no paid balance left.",
    status: "approved", comment: "Approved as unpaid.",
  },
  {
    who: sickLeave, code: "sick", from: at(6), to: at(6), days: 1,
    reason: "Viral fever, doctor advised rest.",
    status: "approved", comment: "Get well soon.",
  },
  {
    // Deliberately in the FUTURE and pending: the demo approves this live, and
    // an approval that also changes attendance mid-demo is harder to narrate.
    who: pendingRequest, code: "paid",
    from: addDays(today, 6), to: addDays(today, 8), days: 3,
    reason: "Short trip, already booked.",
    status: "pending", comment: null,
  },
];

function addDays(day, n) {
  const t = Date.parse(`${day}T00:00:00Z`) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

const leaveInsert = leaveRows
  .filter((r) => typeId[r.code])
  .map((r) => ({
    profile_id: r.who.id,
    leave_type_id: typeId[r.code],
    start_date: r.from,
    end_date: r.to,
    days: r.days,
    reason: r.reason,
    status: r.status,
    decided_by: r.status === "approved" ? admin.id : null,
    decided_at: r.status === "approved" ? new Date(Date.now() - 5 * 86_400_000).toISOString() : null,
    decision_comment: r.comment,
  }));

const { error: leaveError } = await db.from("leave_requests").insert(leaveInsert);
console.log(
  leaveError
    ? `  ✗ leave_requests — ${leaveError.message}`
    : `  ✓ leave_requests — ${leaveInsert.length} rows (1 pending for the approve demo)`,
);

// Approved leave per person, so punches skip those days.
const { data: approved } = await db
  .from("leave_requests")
  .select("profile_id, start_date, end_date")
  .eq("status", "approved");

const onLeave = new Set();
for (const row of approved ?? []) {
  for (let t = Date.parse(`${row.start_date}T00:00:00Z`); t <= Date.parse(`${row.end_date}T00:00:00Z`); t += 86_400_000) {
    onLeave.add(`${row.profile_id}|${new Date(t).toISOString().slice(0, 10)}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Punches for the current month, for EVERYONE
//
// Before this, employees added through the app had no attendance at all, so the
// grid showed them absent every day and v_payable_days gave them zero payable
// days — which looks like a broken app rather than a new joiner.
// ---------------------------------------------------------------------------
const { error: wipePunches } = await db
  .from("attendance_punches")
  .delete()
  .gte("punch_in", `${monthStart}T00:00:00Z`);
if (wipePunches) console.log(`  ! could not clear punches: ${wipePunches.message}`);

const punches = [];
// Deterministic jitter so re-runs produce the same demo, and so check-in times
// look human rather than identical to the second.
const jitter = (seed, spread) => (Math.abs(Math.sin(seed) * 10_000) % spread) | 0;

for (const [personIndex, person] of people.entries()) {
  for (const [dayIndex, day] of weekdays.entries()) {
    if (onLeave.has(`${person.id}|${day}`)) continue;

    // One unexplained absence, so `absent` and the amber dot have a real case.
    if (person.id === absentOnce.id && day === at(3)) continue;

    const inMin = 5 + jitter(personIndex * 31 + dayIndex * 7, 25);   // 09:05–09:29
    const punchIn = istAt(day, 9, inMin);

    // Today's rows are special: nobody has left yet, and the admin is mid-session
    // so the systray and the magenta dot have something to show.
    const isToday = day === today;

    // The Regularize demo: one forgotten check-out, on a day that has passed.
    const forgot = person.id === forgotCheckout.id && day === at(weekdays.length - 3);

    let punchOut = null;
    if (!forgot && !isToday) {
      const halfDay = (personIndex + dayIndex) % 17 === 0; // a few, spread out
      const outHour = halfDay ? 12 : 18;
      const outMin = halfDay ? jitter(personIndex + dayIndex, 30) : jitter(dayIndex * 13 + personIndex, 40);
      punchOut = istAt(day, outHour, outMin);
    }

    punches.push({
      profile_id: person.id,
      punch_in: punchIn,
      punch_out: punchOut,
      source: personIndex % 5 === 0 ? "mobile" : "web",
      is_regularized: false,
      note: forgot ? "Forgot to check out — needs regularization" : null,
    });
  }
}

// Chunked: a single insert of several hundred rows can exceed the request limit.
let inserted = 0;
for (let i = 0; i < punches.length; i += 200) {
  const chunk = punches.slice(i, i + 200);
  const { error } = await db.from("attendance_punches").insert(chunk);
  if (error) {
    console.log(`  ✗ punches chunk ${i / 200} — ${error.message}`);
    break;
  }
  inserted += chunk.length;
}
console.log(`  ✓ attendance_punches — ${inserted} rows across ${people.length} people`);

// ---------------------------------------------------------------------------
// 3. Notifications — a few unread, so the bell has a count on first load
// ---------------------------------------------------------------------------
const probe = await db.from("notifications").select("id").limit(1);
if (probe.error) {
  console.log(`  – notifications skipped: ${probe.error.message.slice(0, 60)} (migration 0005 not applied)`);
} else {
  await db.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const managers = people.filter((p) => p.role === "admin" || p.role === "hr");
  const notes = [
    ...managers.map((m) => ({
      profile_id: m.id,
      type: "leave_submitted",
      title: `${pendingRequest.full_name} requested Paid Time Off`,
      body: `${addDays(today, 6)} – ${addDays(today, 8)} · 3 days · "Short trip, already booked."`,
      link: "/time-off",
      is_read: false,
    })),
    {
      profile_id: paidLeave.id,
      type: "leave_decided",
      title: "Your leave was approved",
      body: `${at(1)} – ${at(2)} · 2 days · "Approved. Enjoy!"`,
      link: "/time-off",
      is_read: false,
    },
    {
      profile_id: sickLeave.id,
      type: "leave_decided",
      title: "Your leave was approved",
      body: `${at(6)} · 1 day · "Get well soon."`,
      link: "/time-off",
      is_read: false,
    },
    {
      profile_id: forgotCheckout.id,
      type: "attendance",
      title: "You have a missing check-out",
      body: "Regularize it from Attendance so the day counts towards payable days.",
      link: "/attendance",
      is_read: false,
    },
  ];

  const { error } = await db.from("notifications").insert(notes);
  console.log(error ? `  ✗ notifications — ${error.message}` : `  ✓ notifications — ${notes.length} unread`);
}

// ---------------------------------------------------------------------------
// 4. What the demo will show
// ---------------------------------------------------------------------------
const { data: payable } = await db.from("v_payable_days").select("*");
const byId = Object.fromEntries(people.map((p) => [p.id, p]));

console.log("\nv_payable_days after refresh (derived, nothing stored):");
for (const row of (payable ?? []).sort((a, b) =>
  (byId[a.profile_id]?.login_id ?? "").localeCompare(byId[b.profile_id]?.login_id ?? ""),
)) {
  const p = byId[row.profile_id];
  if (!p) continue;
  console.log(
    `  ${(p.full_name ?? "").padEnd(16)} working ${row.working_days}  absent ${row.absent_days}  unpaid ${row.unpaid_days}  payable ${row.payable_days}`,
  );
}

console.log(`\nDemo cast:
  Regularize demo   ${forgotCheckout.full_name} — missing check-out on ${at(weekdays.length - 3)}
  Payable-days cut  ${unpaidLeave.full_name} — 1 approved UNPAID day on ${at(4)}
  Approve live      ${pendingRequest.full_name} — pending request, ${addDays(today, 6)} – ${addDays(today, 8)}
  Absent day        ${absentOnce.full_name} — no punch on ${at(3)}`);

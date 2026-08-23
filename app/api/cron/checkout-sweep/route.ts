import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { IST, todayIST } from "@/lib/attendance";

/**
 * Nightly sweep for forgotten check-outs.
 *
 * Scope for this phase is deliberately small: find punches still open from a
 * day before today (IST) and note them, so they show up as needing
 * regularization rather than sitting invisible. It does NOT invent a
 * punch_out — guessing when someone left would corrupt the very data payroll
 * is computed from. A production version would notify the employee and their
 * manager and let the regularization flow resolve it.
 *
 * Runs on the Vercel cron declared in vercel.json. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; when CRON_SECRET is set we require it,
 * so the endpoint cannot be triggered by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Service role: a cron has no user session, so no RLS policy could authorise
  // it. This route is server-only by construction.
  const admin = createAdminClient();
  const today = todayIST();

  const { data, error } = await admin
    .from("attendance_punches")
    .select("id, profile_id, punch_in, note")
    .is("punch_out", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stale = (data ?? []).filter((row) => {
    const dayIST = new Date(row.punch_in as string).toLocaleDateString("en-CA", { timeZone: IST });
    return dayIST < today;
  });

  let flagged = 0;
  for (const row of stale) {
    if (typeof row.note === "string" && row.note.includes("Missing check-out")) continue;
    const { error: updateError } = await admin
      .from("attendance_punches")
      .update({ note: "Missing check-out — needs regularization" })
      .eq("id", row.id);
    if (!updateError) flagged += 1;
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    today,
    openPunches: (data ?? []).length,
    staleFromEarlierDays: stale.length,
    newlyFlagged: flagged,
  });
}

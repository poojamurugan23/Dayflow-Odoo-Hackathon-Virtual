import { Suspense } from "react";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { getOpenPunch, getTodayStatuses, type DayStatus } from "@/lib/attendance";
import { listEmployees } from "@/lib/employees";
import { EmployeeDirectory } from "@/components/employee-directory";
import { EmployeeGridSkeleton } from "@/components/employee-grid-skeleton";

export const metadata: Metadata = { title: "Employees · Dayflow" };

function today(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function EmployeesPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Employees</h1>
      {/* Naming the day matters: on a Saturday every dot is legitimately a week
          off, and without the date a grid of grey dots reads as broken. */}
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone in your organization, with attendance for {today()}.
      </p>

      <div className="mt-6">
        <Suspense fallback={<EmployeeGridSkeleton />}>
          <Directory />
        </Suspense>
      </div>
    </section>
  );
}

/**
 * Split out so the toolbar and grid stream in behind a skeleton while the two
 * queries run. RLS decides the row set — an employee simply gets one card.
 */
async function Directory() {
  const [user, employees, todayStatuses] = await Promise.all([
    getCurrentUser(),
    listEmployees(),
    getTodayStatuses(),
  ]);

  // Only the signed-in user's own live state is known here. Showing every
  // colleague's live dot would need a second query over open punches; the
  // derived status already covers "was here today" for everyone else.
  const openPunch = user ? await getOpenPunch(user.id) : null;
  const liveIds = openPunch?.isToday && user ? [user.id] : [];

  const statuses: Record<string, DayStatus> = {};
  for (const [id, status] of todayStatuses) statuses[id] = status;

  return (
    <EmployeeDirectory
      employees={employees}
      statuses={statuses}
      canCreate={user?.isManager ?? false}
      liveIds={liveIds}
    />
  );
}

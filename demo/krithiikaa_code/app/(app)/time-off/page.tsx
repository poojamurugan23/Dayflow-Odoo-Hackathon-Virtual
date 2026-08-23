import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import {
  conflictsForRequests,
  getBalances,
  getHolidayDates,
  getHolidayMap,
  getLeaveCalendar,
  getPendingCount,
  getUpcomingHolidays,
  listAllocations,
  listLeaveRequests,
  listLeaveTypes,
} from "@/lib/leave";
import { todayIST } from "@/lib/attendance";
import { BalanceChips, PendingChip } from "@/components/time-off/balance-chips";
import { AdminQueue } from "@/components/time-off/admin-queue";
import { AllocationList } from "@/components/time-off/allocation-list";
import { LeaveCalendar } from "@/components/time-off/leave-calendar";
import { RequestTable } from "@/components/time-off/request-table";
import { TimeOffRequest, type LeaveTypeChoice } from "@/components/time-off-request";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Time Off · Dayflow" };

/**
 * One route, two views, branched by role — the same shape as /attendance.
 *
 * A manager gets the org-wide queue plus an Allocation sub-tab; an employee gets
 * their own balances and requests. There is no separate admin URL: RLS already
 * decides which leave_requests rows each caller can read, so a second route
 * would be a second thing to secure without adding any security.
 */
export default async function TimeOffPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Time Off</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Approving a request flips those days to <span className="text-foreground">leave</span> in
        Attendance — derived, not copied.
      </p>

      <div className="mt-6">
        <Suspense fallback={<TimeOffSkeleton />}>
          <View tab={params.tab} />
        </Suspense>
      </div>
    </section>
  );
}

async function View({ tab }: { tab?: string }) {
  const user = await getCurrentUser();
  if (!user) return null;

  return user.isManager ? (
    <ManagerView userId={user.id} tab={tab} />
  ) : (
    <EmployeeView userId={user.id} fullName={user.fullName} />
  );
}

// ---------------------------------------------------------------------------
// Employee — own balances, own requests, NEW
// ---------------------------------------------------------------------------
async function EmployeeView({ userId, fullName }: { userId: string; fullName: string }) {
  const [balances, requests, types, holidays, calendarLeave, holidayMap, upcomingHolidays] =
    await Promise.all([
      getBalances(userId),
      // No profileId filter needed — RLS returns own-only. Passing one would
      // suggest the filter is what protects this, and it is not.
      listLeaveRequests(),
      listLeaveTypes(),
      getHolidayDates(),
      getLeaveCalendar(),
      getHolidayMap(),
      getUpcomingHolidays(),
    ]);

  // Unpaid leave has no allocation row and therefore no balance, which is
  // correct: `available: null` is what tells the modal not to show a ceiling.
  const choices: LeaveTypeChoice[] = types.map((type) => ({
    id: type.id,
    name: type.name,
    code: type.code,
    isPaid: type.isPaid,
    requiresAttachment: type.requiresAttachment,
    available: balances.find((b) => b.leaveTypeId === type.id)?.available ?? null,
  }));

  return (
    <div className="space-y-6">
      <BalanceChips balances={balances} />

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-foreground">My requests</h2>
        <TimeOffRequest leaveTypes={choices} holidays={holidays} employeeName={fullName} />
      </div>

      <RequestTable
        requests={requests}
        emptyMessage="No requests yet — request time off with the NEW button."
      />

      {/* Wireframe image 7. Employee view only: an admin's screen is the
          approval queue, and a calendar of one person's leave is not what they
          are there to do. */}
      <LeaveCalendar
        today={todayIST()}
        leave={calendarLeave}
        holidays={holidayMap}
        upcomingHolidays={upcomingHolidays}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager — the queue, plus Allocation
// ---------------------------------------------------------------------------
async function ManagerView({ userId, tab }: { userId: string; tab?: string }) {
  const isAllocation = tab === "allocation";

  const [pending, requests, allocations] = await Promise.all([
    getPendingCount(),
    listLeaveRequests(),
    isAllocation ? listAllocations() : Promise.resolve([]),
  ]);

  // Pending first — the queue is the job. Within each group, most recent range.
  const ordered = [...requests].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  // Only for rows still awaiting a decision — a conflict on an already-decided
  // request is history, not information.
  const conflicts = await conflictsForRequests(
    ordered.filter((r) => r.status === "pending"),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PendingChip count={pending} />
        <Link
          href="/attendance"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          See the effect in Attendance
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>

      {/* Time Off | Allocation, per the wireframe. Links rather than client-side
          tabs so each view is a real URL that can be shared and reloaded. */}
      <nav aria-label="Time off sections" className="flex items-center gap-1 border-b border-border">
        <SubTab href="/time-off" label="Time Off" active={!isAllocation} />
        <SubTab href="/time-off?tab=allocation" label="Allocation" active={isAllocation} />
      </nav>

      {isAllocation ? (
        <AllocationList rows={allocations} />
      ) : (
        <AdminQueue requests={ordered} currentUserId={userId} conflicts={conflicts} />
      )}
    </div>
  );
}

function SubTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "relative px-3 py-2 text-sm font-medium text-foreground"
          : "px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {label}
      {active && (
        <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function TimeOffSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Skeleton className="h-[5.25rem] w-40 rounded-xl" />
        <Skeleton className="h-[5.25rem] w-40 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

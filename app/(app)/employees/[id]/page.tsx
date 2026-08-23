import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ShieldOff, TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getOpenPunch, getTodayStatuses } from "@/lib/attendance";
import { getEmployee, getPrivateInfo, listManagerOptions } from "@/lib/employees";
import { getCurrentSalary, getPayableDays, getSalaryHistory, getStatutoryConfig } from "@/lib/payroll";
import { monthLabel, monthStartOf, todayIST } from "@/lib/attendance";
import type { SalaryTabData } from "@/components/salary/salary-tab";
import { EmployeeProfile } from "@/components/profile/employee-profile";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";

export const metadata: Metadata = { title: "Employee · Dayflow" };

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section>
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Employees
      </Link>

      <div className="mt-4">
        <Suspense fallback={<ProfileSkeleton />}>
          <Profile id={id} />
        </Suspense>
      </div>
    </section>
  );
}

async function Profile({ id }: { id: string }) {
  const [user, result] = await Promise.all([getCurrentUser(), getEmployee(id)]);

  if (!user) return <NotAuthorised />;

  // A permission answer and a broken query are different problems and get
  // different screens. Conflating them hides real bugs behind a plausible
  // "you can't see this" message.
  if (result.kind === "forbidden") return <NotAuthorised />;
  if (result.kind === "failed") return <LoadFailed message={result.message} />;

  const employee = result.employee;
  const isSelf = user.id === employee.id;
  const isAdmin = user.role === "admin";

  const [info, todayStatuses, managers, openPunch, salary] = await Promise.all([
    getPrivateInfo(employee.id),
    getTodayStatuses(),
    user.isManager ? listManagerOptions() : Promise.resolve([]),
    // RLS lets you read your own punches, and a manager read anyone's, so this
    // is the same permission boundary as the rest of the page.
    getOpenPunch(employee.id),
    // Fetched ONLY when the viewer is entitled to it. An HR officer viewing
    // someone else's profile gets null here, so no wage ever reaches their
    // browser — the tab being absent is a consequence, not the control. RLS is
    // the backstop: after 0006 the SELECT policy would return no rows anyway.
    isAdmin || isSelf ? loadSalary(employee.id) : Promise.resolve(null),
  ]);

  return (
    <EmployeeProfile
      employee={employee}
      info={info}
      todayStatus={todayStatuses.get(employee.id)}
      live={Boolean(openPunch?.isToday)}
      isSelf={isSelf}
      isManager={user.isManager}
      managers={managers}
      salary={salary}
      isAdmin={isAdmin}
    />
  );
}

/**
 * Everything the Salary Info tab needs, in one place so both this route and
 * /profile assemble it identically.
 *
 * Payable days are READ from v_payable_days — see lib/payroll.ts. The month
 * label matches the window v_daily_attendance currently spans, so the strip
 * never implies it covers more than it does.
 */
export async function loadSalary(profileId: string): Promise<SalaryTabData | null> {
  const [structure, statutory, payable, history] = await Promise.all([
    getCurrentSalary(profileId),
    getStatutoryConfig(),
    getPayableDays(profileId),
    getSalaryHistory(profileId),
  ]);

  if (!structure) return null;

  return {
    profileId,
    monthlyWage: structure.monthlyWage,
    effectiveFrom: structure.effectiveFrom,
    rules: structure.rules,
    statutory,
    payable,
    month: monthLabel(monthStartOf(todayIST())),
    history: history.map((row) => ({
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      monthlyWage: row.monthlyWage,
    })),
  };
}

function LoadFailed({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-destructive/40 px-6 py-16 text-center">
      <TriangleAlert className="size-8 text-destructive/70" aria-hidden />
      <h1 className="mt-4 text-sm font-medium text-foreground">Couldn&apos;t load this profile</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        This is a fault on our side, not a permission problem.
      </p>
      <code className="mt-3 max-w-md break-words rounded bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {message}
      </code>
      <Link
        href="/employees"
        className="mt-5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back to employees
      </Link>
    </div>
  );
}

function NotAuthorised() {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-20 text-center">
      <ShieldOff className="size-8 text-muted-foreground/50" aria-hidden />
      <h1 className="mt-4 text-sm font-medium text-foreground">You can&apos;t view this profile</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Employees can see their own profile. Ask HR if you need access to someone else&apos;s.
      </p>
      <Link
        href="/employees"
        className="mt-5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back to employees
      </Link>
    </div>
  );
}

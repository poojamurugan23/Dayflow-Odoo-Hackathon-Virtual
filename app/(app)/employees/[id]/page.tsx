import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ShieldOff, TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getOpenPunch, getTodayStatuses } from "@/lib/attendance";
import { getEmployee, getPrivateInfo, listManagerOptions } from "@/lib/employees";
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

  const [info, todayStatuses, managers, openPunch] = await Promise.all([
    getPrivateInfo(employee.id),
    getTodayStatuses(),
    user.isManager ? listManagerOptions() : Promise.resolve([]),
    // RLS lets you read your own punches, and a manager read anyone's, so this
    // is the same permission boundary as the rest of the page.
    getOpenPunch(employee.id),
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
    />
  );
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

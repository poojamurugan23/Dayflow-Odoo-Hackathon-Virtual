import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ShieldOff } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getTodayStatuses } from "@/lib/attendance";
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
  const [user, employee] = await Promise.all([getCurrentUser(), getEmployee(id)]);

  // RLS returns nothing when one employee asks for another employee's id. That
  // is a permission answer, not a failure, so it gets a state of its own rather
  // than a 404 or a crash.
  if (!employee || !user) return <NotAuthorised />;

  const isSelf = user.id === employee.id;

  const [info, todayStatuses, managers] = await Promise.all([
    getPrivateInfo(employee.id),
    getTodayStatuses(),
    user.isManager ? listManagerOptions() : Promise.resolve([]),
  ]);

  return (
    <EmployeeProfile
      employee={employee}
      info={info}
      todayStatus={todayStatuses.get(employee.id)}
      isSelf={isSelf}
      isManager={user.isManager}
      managers={managers}
    />
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

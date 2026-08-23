import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusDot } from "@/components/status-dot";
import { initials, type DayStatus } from "@/lib/display";
import type { EmployeeCard as Employee } from "@/lib/employees";

/** One clickable employee card. Opens the profile read-only. */
export function EmployeeCard({
  employee,
  status,
}: {
  employee: Employee;
  status: DayStatus | undefined;
}) {
  return (
    <Link
      href={`/employees/${employee.id}`}
      className="group relative flex flex-col items-center rounded-lg border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Status pinned top-right, per the wireframe. */}
      <span className="absolute right-3 top-3">
        <StatusDot status={status} />
      </span>

      <Avatar className="size-16">
        {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt="" />}
        <AvatarFallback className="text-sm">{initials(employee.fullName)}</AvatarFallback>
      </Avatar>

      <h3 className="mt-3 text-[15px] font-semibold leading-tight text-card-foreground">
        {employee.fullName}
      </h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{employee.jobPosition ?? "—"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">{employee.department ?? "—"}</p>
    </Link>
  );
}

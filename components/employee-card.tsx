import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusDot } from "@/components/status-dot";
import { initials, type DayStatus } from "@/lib/display";
import type { EmployeeCard as Employee } from "@/lib/employees";

/** One clickable employee card. Opens the profile read-only. */
export function EmployeeCard({
  employee,
  status,
  live = false,
}: {
  employee: Employee;
  status: DayStatus | undefined;
  live?: boolean;
}) {
  return (
    <Link
      href={`/employees/${employee.id}`}
      // transform + opacity + colour only, 180ms — no layout properties, so the
      // hover never reflows the grid. motion-safe: keeps the lift out of the way
      // for anyone who asked for reduced motion.
      className="group relative flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-plum/25 hover:shadow-[0_8px_24px_-12px_rgba(36,24,38,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:hover:-translate-y-0.5"
    >
      {/* Status pinned top-right, per the wireframe. */}
      <span className="absolute right-3 top-3">
        <StatusDot status={status} live={live} />
      </span>

      <Avatar className="size-16 transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]">
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

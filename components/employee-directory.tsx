"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeCard } from "@/components/employee-card";
import type { DayStatus } from "@/lib/display";
import type { EmployeeCard as Employee } from "@/lib/employees";

type Props = {
  employees: Employee[];
  /** profile id -> today's status, from v_daily_attendance. */
  statuses: Record<string, DayStatus>;
  canCreate: boolean;
};

/**
 * Toolbar + grid. Filtering is client-side over the already-fetched list, so
 * typing does not round-trip to the server on every keystroke.
 */
export function EmployeeDirectory({ employees, statuses, canCreate }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        (e.jobPosition ?? "").toLowerCase().includes(q),
    );
  }, [employees, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {canCreate && (
          <Button asChild size="lg">
            <Link href="/employees/new">
              <Plus className="size-4" aria-hidden />
              New
            </Link>
          </Button>
        )}

        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or job position"
            aria-label="Search employees by name or job position"
            className="pl-9"
          />
        </div>

        <p className="ml-auto text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} of {employees.length}
        </p>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          title="No employees yet"
          body={
            canCreate
              ? "Add your first employee and Dayflow will generate their login ID and a one-time password for you to hand over."
              : "Nothing to show here yet."
          }
          action={canCreate ? { href: "/employees/new", label: "Add your first employee" } : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`Nothing matches “${query.trim()}”`}
          body="Try part of a name, or a job position like “Engineer”."
        />
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((employee) => (
            <li key={employee.id}>
              <EmployeeCard employee={employee} status={statuses[employee.id]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <Users className="size-8 text-muted-foreground/50" aria-hidden />
      <h2 className="mt-4 text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && (
        <Button asChild className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

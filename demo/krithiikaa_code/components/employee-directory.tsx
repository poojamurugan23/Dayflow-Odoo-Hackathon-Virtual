"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Settings, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

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
  /** Profile ids with an open punch right now — their dot goes magenta. */
  liveIds?: string[];
};

/**
 * Toolbar + grid. Filtering is client-side over the already-fetched list, so
 * typing does not round-trip to the server on every keystroke.
 */
export function EmployeeDirectory({ employees, statuses, canCreate, liveIds = [] }: Props) {
  const live = new Set(liveIds);
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

        {/* Wireframe image 4 shows a Settings affordance on this screen. It is
            also in the account menu; this is the one the wireframe draws. */}
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" aria-hidden />
        </Link>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Users}
          title="No employees yet"
          body={
            canCreate
              ? "Add your first employee — Dayflow generates their login ID and a one-time password for you to hand over."
              : "Your team will appear here once HR adds them."
          }
          action={canCreate ? { href: "/employees/new", label: "Add your first employee" } : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Search}
          title={`Nothing matches “${query.trim()}”`}
          body="Try part of a name, or a job position like “Engineer”."
        />
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((employee) => (
            <li key={employee.id}>
              <EmployeeCard
                employee={employee}
                status={statuses[employee.id]}
                live={live.has(employee.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

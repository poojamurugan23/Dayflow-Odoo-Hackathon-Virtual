import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { listManagerOptions } from "@/lib/employees";
import { NewEmployeeForm } from "@/components/new-employee-form";

export const metadata: Metadata = { title: "New employee · Dayflow" };

export default async function NewEmployeePage() {
  const user = await getCurrentUser();

  // Route-level guard, not just a hidden button. An employee who types this URL
  // gets a 404 rather than a form that would fail on submit. notFound() rather
  // than a redirect so the page does not confirm that it exists.
  if (!user?.isManager) notFound();

  const managers = await listManagerOptions();

  return (
    <section>
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Employees
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">New employee</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Dayflow generates the login ID and a one-time password. Employees cannot register
        themselves, so this is the only way in.
      </p>

      <div className="mt-8">
        <NewEmployeeForm managers={managers} />
      </div>
    </section>
  );
}

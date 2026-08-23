import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { roleLabel } from "@/lib/display";

export const metadata: Metadata = { title: "Settings · Dayflow" };

/**
 * Settings (wireframe image 4 shows the affordance on the employee grid).
 *
 * Deliberately shallow: the organisation's identity, and nothing editable.
 * Everything a real settings screen would own — renaming the org, uploading a
 * new logo, editing work schedules, statutory percentages, leave-type
 * definitions — changes how existing records are interpreted, so each one needs
 * its own effective-dating and audit story. Shipping a half-wired form that
 * silently rescored attendance history would be worse than shipping this.
 *
 * The affordance exists because the wireframe has it; the depth is out of scope
 * and said so plainly on the page rather than in a comment only.
 */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <section className="max-w-2xl">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Employees
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your organisation, as Dayflow knows it.</p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          {user.organization?.logoUrl ? (
            <Image
              src={user.organization.logoUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-lg"
              unoptimized
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
              {user.organization?.code ?? "DF"}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-foreground">
              {user.organization?.name ?? "Dayflow"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              Org code {user.organization?.code ?? "—"} · your login IDs start with it
            </p>
          </div>
        </div>

        <dl className="mt-5 divide-y divide-border border-t border-border pt-1 text-sm">
          <Row label="Signed in as" value={user.fullName} />
          <Row label="Your role" value={roleLabel(user.role)} />
          <Row label="Your login ID" value={user.loginId} mono />
        </dl>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Editing the organisation, work schedules and statutory rates is not in this build.
          Those values change how past attendance and payroll are read, so each needs
          effective-dating rather than an in-place edit.
        </span>
      </p>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

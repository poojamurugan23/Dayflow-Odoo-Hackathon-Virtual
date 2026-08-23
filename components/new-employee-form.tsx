"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { createEmployee } from "@/actions/employees";
import { EMPTY_NEW_EMPLOYEE_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ManagerOption = { id: string; label: string };

export function NewEmployeeForm({ managers }: { managers: ManagerOption[] }) {
  const [state, formAction] = useActionState(createEmployee, EMPTY_NEW_EMPLOYEE_STATE);

  // Credentials are returned once and never stored in readable form again.
  if (state.created) {
    return <Handover created={state.created} warning={state.error} />;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="fullName" label="Full name" required autoFocus placeholder="Ananya Desai" />
        <Field name="email" label="Work email" type="email" required placeholder="ananya.desai@odooindia.example" />
        <Field name="phone" label="Phone" type="tel" placeholder="+91 98450 00000" />
        <Field name="jobPosition" label="Job position" required placeholder="Frontend Engineer" />
        <Field name="department" label="Department" placeholder="Engineering" />
        <Field name="location" label="Location" placeholder="Bengaluru" />

        <div className="space-y-1.5">
          <Label htmlFor="managerId">Manager</Label>
          <select
            id="managerId"
            name="managerId"
            defaultValue=""
            className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">No manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.label}
              </option>
            ))}
          </select>
        </div>

        <Field name="dateOfJoining" label="Date of joining" type="date" required defaultValue={today} />

        <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
          <Label htmlFor="monthlyWage">Monthly wage (₹)</Label>
          <Input
            id="monthlyWage"
            name="monthlyWage"
            type="number"
            min="1"
            step="1"
            required
            placeholder="50000"
            className="font-mono tabular-nums"
          />
          <p className="text-xs text-muted-foreground">
            Sets up the salary structure. The breakdown becomes editable in Phase 5.
          </p>
        </div>
      </div>

      <FormError message={state.error} />

      <div className="flex items-center gap-3">
        <div className="w-40">
          <SubmitButton>Create employee</SubmitButton>
        </div>
        <Button asChild variant="ghost" size="lg">
          <Link href="/employees">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  ...props
}: { name: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

/**
 * The one and only time the temporary password is visible. It is not stored
 * anywhere readable — Supabase keeps only a hash — so if HR loses this screen
 * the password has to be reset rather than looked up.
 */
function Handover({
  created,
  warning,
}: {
  created: { fullName: string; loginId: string; tempPassword: string; profileId: string };
  warning: string | null;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: "#1F8A5F" }} aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-card-foreground">
            {created.fullName} is set up
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand these over now. The password is shown only this once — after this you can reset it,
            but not read it.
          </p>

          <dl className="mt-4 space-y-2">
            <Credential label="Login ID" value={created.loginId} />
            <Credential label="Temporary password" value={created.tempPassword} />
          </dl>

          <p className="mt-4 text-xs text-muted-foreground">
            They will be asked to choose their own password the first time they sign in.
          </p>

          {warning && (
            <p className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/employees/${created.profileId}`}>Open profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employees">Back to employees</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/employees/new">Add another</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="truncate font-mono text-sm text-foreground">{value}</dd>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

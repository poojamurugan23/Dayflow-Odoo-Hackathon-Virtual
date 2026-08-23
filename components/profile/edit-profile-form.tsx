"use client";

import { useActionState, useEffect } from "react";

import { updateEmployee } from "@/actions/employees";
import { EMPTY_EDIT_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeDetail, PrivateInfo } from "@/lib/employees";

type Props = {
  employee: EmployeeDetail;
  info: PrivateInfo | null;
  /** Managers get every field; the owner gets phone and address only. */
  canEditAll: boolean;
  managers: { id: string; label: string }[];
  onDone: () => void;
};

/**
 * Edit form. Which inputs appear is decided from `canEditAll`, but that is only
 * an affordance — actions/employees.ts re-derives the permitted field list from
 * the actor's role server-side and ignores anything outside it, so a crafted
 * request cannot widen what an employee may change.
 */
export function EditProfileForm({ employee, info, canEditAll, managers, onDone }: Props) {
  const [state, formAction] = useActionState(updateEmployee, EMPTY_EDIT_STATE);

  // Leave edit mode once the save lands. This has to be an effect: calling
  // onDone() during render would update the parent mid-render, which React
  // rejects outright.
  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="targetId" value={employee.id} />

      {canEditAll ? (
        <>
          <Group title="Job details">
            <Text name="full_name" label="Full name" defaultValue={employee.fullName} />
            <Text name="email" label="Work email" type="email" defaultValue={employee.email} />
            <Text name="phone" label="Phone" defaultValue={employee.phone ?? ""} />
            <Text name="job_position" label="Job position" defaultValue={employee.jobPosition ?? ""} />
            <Text name="department" label="Department" defaultValue={employee.department ?? ""} />
            <Text name="location" label="Location" defaultValue={employee.location ?? ""} />
            <Text name="employee_code" label="Employee code" defaultValue={employee.employeeCode ?? ""} />
            <Text name="date_of_joining" label="Date of joining" type="date" defaultValue={employee.dateOfJoining} />

            <div className="space-y-1.5">
              <Label htmlFor="manager_id">Manager</Label>
              <select
                id="manager_id"
                name="manager_id"
                defaultValue={employee.managerId ?? ""}
                className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">No manager</option>
                {managers
                  .filter((m) => m.id !== employee.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>
          </Group>

          <Group title="Personal">
            <Text name="dob" label="Date of birth" type="date" defaultValue={info?.dob ?? ""} />
            <Text name="nationality" label="Nationality" defaultValue={info?.nationality ?? ""} />
            <Text name="personal_email" label="Personal email" type="email" defaultValue={info?.personalEmail ?? ""} />
            <Text name="gender" label="Gender" defaultValue={info?.gender ?? ""} />
            <Text name="marital_status" label="Marital status" defaultValue={info?.maritalStatus ?? ""} />
            <div className="sm:col-span-2">
              <Label htmlFor="residing_address">Residing address</Label>
              <Textarea
                id="residing_address"
                name="residing_address"
                rows={2}
                defaultValue={info?.residingAddress ?? ""}
                className="mt-1.5"
              />
            </div>
          </Group>

          <Group title="Bank details">
            <Text name="bank_account_no" label="Account number" defaultValue={info?.bankAccountNo ?? ""} />
            <Text name="bank_name" label="Bank name" defaultValue={info?.bankName ?? ""} />
            <Text name="ifsc" label="IFSC code" defaultValue={info?.ifsc ?? ""} />
            <Text name="pan_no" label="PAN number" defaultValue={info?.panNo ?? ""} />
            <Text name="uan_no" label="UAN number" defaultValue={info?.uanNo ?? ""} />
          </Group>

      
        </>
      ) : (
        <Group title="Your details">
          <Text name="phone" label="Phone" defaultValue={employee.phone ?? ""} />
          <div className="sm:col-span-2">
            <Label htmlFor="residing_address">Residing address</Label>
            <Textarea
              id="residing_address"
              name="residing_address"
              rows={2}
              defaultValue={info?.residingAddress ?? ""}
              className="mt-1.5"
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Name, job details and bank details are managed by HR. Your profile picture is editable
            from the avatar above.
          </p>
        </Group>
      )}

      {/* Resume sections (SRS 3.3.1). Skills and certifications are text[] in
          Postgres; the form takes them comma-separated and the action splits. */}
      <Group title="Resume">
        <div className="sm:col-span-2">
          <Label htmlFor="about">About</Label>
          <Textarea id="about" name="about" rows={3} defaultValue={employee.about ?? ""} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="job_love">What I love about my job</Label>
          <Textarea id="job_love" name="job_love" rows={2} defaultValue={employee.jobLove ?? ""} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="interests">My interests and hobbies</Label>
          <Textarea id="interests" name="interests" rows={2} defaultValue={employee.interests ?? ""} className="mt-1.5" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills</Label>
          <Input id="skills" name="skills" defaultValue={employee.skills.join(", ")} placeholder="React, PostgreSQL, Go" />
          <p className="text-xs text-muted-foreground">Separate with commas.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="certifications">Certification</Label>
          <Input id="certifications" name="certifications" defaultValue={employee.certifications.join(", ")} placeholder="AWS SAA, CKA" />
          <p className="text-xs text-muted-foreground">Separate with commas.</p>
        </div>
      </Group>


      <FormError message={state.error} />

      <div className="flex items-center gap-3">
        <div className="w-32">
          <SubmitButton>Save</SubmitButton>
        </div>
        <Button type="button" variant="ghost" size="lg" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Text({
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

import { Lock, ShieldOff } from "lucide-react";

import { FieldRow } from "@/components/profile/field-row";
import { formatDate } from "@/lib/display";
import type { PrivateInfo } from "@/lib/employees";

/**
 * Private Info tab (SRS 3.3.1) — personal details and bank details.
 *
 * `info` is null when RLS withheld the row, which is what happens if one
 * employee asks for another's. That is a permission outcome, not an error, so it
 * renders as a state rather than throwing.
 */
export function PrivateInfoTab({
  info,
  dateOfJoining,
  employeeCode,
  canSeeBank,
  bankEditable,
}: {
  info: PrivateInfo | null;
  dateOfJoining: string;
  employeeCode: string | null;
  canSeeBank: boolean;
  bankEditable: boolean;
}) {
  if (!info) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
        <ShieldOff className="size-7 text-muted-foreground/50" aria-hidden />
        <h3 className="mt-3 text-sm font-medium text-foreground">Not available to you</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Personal and bank details are visible only to the person they belong to and to HR.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Personal
        </h3>
        <dl className="divide-y divide-border">
          <FieldRow label="Date of birth" value={formatDate(info.dob)} />
          <FieldRow label="Residing address" value={info.residingAddress} />
          <FieldRow label="Nationality" value={info.nationality} />
          <FieldRow label="Personal email" value={info.personalEmail} />
          <FieldRow label="Gender" value={info.gender} />
          <FieldRow label="Marital status" value={info.maritalStatus} />
          <FieldRow label="Date of joining" value={formatDate(dateOfJoining)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          Bank details
          {!bankEditable && <Lock className="size-3" aria-hidden />}
        </h3>

        {canSeeBank ? (
          <>
            <dl className="divide-y divide-border">
              <FieldRow label="Account number" value={info.bankAccountNo} mono />
              <FieldRow label="Bank name" value={info.bankName} />
              <FieldRow label="IFSC code" value={info.ifsc} mono />
              <FieldRow label="PAN number" value={info.panNo} mono />
              <FieldRow label="UAN number" value={info.uanNo} mono />
              <FieldRow label="Employee code" value={employeeCode} mono />
            </dl>

            {!bankEditable && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Changes to bank details require HR.
              </p>
            )}
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Hidden.
          </p>
        )}
      </section>
    </div>
  );
}

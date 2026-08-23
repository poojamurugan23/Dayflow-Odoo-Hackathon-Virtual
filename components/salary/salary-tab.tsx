"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { History, Lock, RotateCcw, ShieldOff, TriangleAlert } from "lucide-react";

import { updateWage } from "@/actions/salary";
import { EMPTY_WAGE_STATE } from "@/lib/form-state";
import {
  componentsTotal,
  computeDeductions,
  computeFromRules,
  formatINR,
  yearlyWage,
  type ComponentRule,
  type StatutoryConfig,
} from "@/lib/salary";
import type { PayableDays, WorkSchedule } from "@/lib/payroll";
import { formatDate } from "@/lib/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentsTable } from "@/components/salary/components-table";
import { DeductionsPanel } from "@/components/salary/deductions-panel";
import { PayableDaysStrip } from "@/components/salary/payable-days-strip";
import { ValidationStrip } from "@/components/salary/validation-strip";

export type SalaryTabData = {
  profileId: string;
  monthlyWage: number;
  effectiveFrom: string;
  rules: ComponentRule[];
  statutory: StatutoryConfig;
  /** Read-only this phase — see getWorkSchedule() for why. */
  schedule: WorkSchedule | null;
  payable: PayableDays | null;
  month: string;
  /** Previous structures, newest first — the versioning trail. */
  history: { effectiveFrom: string; effectiveTo: string | null; monthlyWage: number }[];
};

/**
 * Salary Info (SRS 3.6). Read-only for an employee, wage-editable for an admin.
 *
 * `canEdit` decides whether an input is rendered. It is NOT the permission:
 * updateWage() checks `role === "admin"` itself, and migration 0006 revokes every
 * write grant on both salary tables so there is no API path either. This flag
 * only avoids showing a control that would be refused.
 *
 * Recalculation is local and immediate — every component, the validation strip
 * and all four deduction rows recompute from the typed wage using the same pure
 * function the server action uses. Nothing is written until Save.
 */
export function SalaryTab({
  data,
  canEdit,
  isSelf,
}: {
  data: SalaryTabData | null;
  canEdit: boolean;
  isSelf: boolean;
}) {
  // The empty state is split into its own branch so that SalaryFigures below can
  // take a non-null `data` and call its hooks unconditionally. Putting the early
  // return above the useMemo calls in one component breaks the rules of hooks —
  // the render order changes the first time a salary loads.
  if (!data) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <ShieldOff className="size-7 text-muted-foreground/50" aria-hidden />
        <h3 className="mt-3 text-sm font-medium text-foreground">
          {isSelf ? "No salary structure yet" : "Not available to you"}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {isSelf
            ? "HR sets this up when your employment record is created."
            : "Salary is visible only to the person it belongs to and to an admin."}
        </p>
      </div>
    );
  }

  // Keyed by structure id so saving a new wage remounts with a clean draft
  // rather than reconciling against the replaced structure's state.
  return <SalaryFigures key={data.profileId} data={data} canEdit={canEdit} />;
}

function SalaryFigures({ data, canEdit }: { data: SalaryTabData; canEdit: boolean }) {
  const [state, formAction, pending] = useActionState(updateWage, EMPTY_WAGE_STATE);

  // The wage being previewed. Kept as a string so a half-typed "5000." does not
  // become NaN and blank the whole table mid-keystroke.
  const [draft, setDraft] = useState(() => String(data.monthlyWage));

  // After a successful save the server sends fresh props; re-sync so Reset goes
  // back to the NEW wage rather than the one that was replaced.
  useEffect(() => {
    setDraft(String(data.monthlyWage));
  }, [data.monthlyWage]);

  const parsed = Number(draft);
  const previewWage = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const dirty = previewWage !== data.monthlyWage;

  // The rules come from the DATABASE, so a structure created under different
  // rules renders the figures it was created with rather than today's defaults.
  const components = useMemo(
    () => computeFromRules(previewWage, data.rules),
    [previewWage, data.rules],
  );
  const total = componentsTotal(components);
  const deductions = useMemo(
    () => computeDeductions(components, previewWage, data.statutory),
    [components, previewWage, data.statutory],
  );

  return (
    <div className="space-y-6">
      {/* Innovation 4, first: this is the figure the whole chain produces, and
          it is what the demo points at. */}
      <PayableDaysStrip payable={data.payable} month={data.month} />

      {/* ---- Wage ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Month wage</p>
          {canEdit ? (
            <form action={formAction} className="mt-1.5">
              <input type="hidden" name="profileId" value={data.profileId} />
              <Label htmlFor="monthlyWage" className="sr-only">
                Monthly wage in rupees
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-lg text-muted-foreground">₹</span>
                  <Input
                    id="monthlyWage"
                    name="monthlyWage"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="h-9 w-36 font-mono text-lg tabular-nums"
                  />
                </div>
                <Button type="submit" size="sm" disabled={pending || !dirty || previewWage <= 0}>
                  {pending ? "Saving…" : "Save new wage"}
                </Button>
                {dirty && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft(String(data.monthlyWage))}
                  >
                    <RotateCcw className="size-3" aria-hidden />
                    Reset
                  </Button>
                )}
              </div>

              {dirty && previewWage > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Previewing ₹{formatINR(previewWage)}. Saving creates a new structure effective
                  today and closes the current one — the old figures are kept.
                </p>
              )}
              {state.error && (
                <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {state.error}
                </p>
              )}
              {state.saved && !dirty && (
                <p role="status" className="mt-2 text-xs" style={{ color: "#1F8A5F" }}>
                  Saved. New structure effective {formatDate(state.effectiveFrom ?? null)}.
                </p>
              )}
            </form>
          ) : (
            <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
              <span className="text-base font-normal text-muted-foreground">₹</span>
              {formatINR(data.monthlyWage)}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Yearly wage</p>
          <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            <span className="text-base font-normal text-muted-foreground">₹</span>
            {formatINR(yearlyWage(previewWage))}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
            month × 12
          </p>
        </div>
      </div>

      {/* ---- Schedule (wireframe image 2) ----
          Beside the wage fields, as the wireframe places them. Read-only for
          everyone: changing a schedule retroactively rescores attendance
          history, which needs effective-dating of its own. */}
      {data.schedule && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Working days in a week</p>
            <p className="mt-0.5 font-mono text-lg font-medium tabular-nums text-foreground">
              {data.schedule.daysPerWeek}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                days · {data.schedule.hoursPerDay} hrs/day
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Break time</p>
            <p className="mt-0.5 font-mono text-lg font-medium tabular-nums text-foreground">
              {formatBreak(data.schedule.breakMinutes)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                hrs · half day under {data.schedule.halfDayThreshold} hrs
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ---- Validation ---- */}
      <ValidationStrip total={total} wage={previewWage} />

      {/* ---- Components ---- */}
      <ComponentsTable components={components} animate={canEdit} />

      {/* ---- Deductions ---- */}
      <DeductionsPanel deductions={deductions} config={data.statutory} animate={canEdit} />

      {/* ---- Provenance ---- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <History className="size-3" aria-hidden />
          Effective from {formatDate(data.effectiveFrom)}
        </span>
        {!canEdit && (
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3" aria-hidden />
            Read-only. Salary changes are made by an admin.
          </span>
        )}
      </div>

      {data.history.length > 1 && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-foreground">
            Salary history ({data.history.length} structures)
          </summary>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className="pb-1 font-medium">From</th>
                <th scope="col" className="pb-1 font-medium">To</th>
                <th scope="col" className="pb-1 text-right font-medium">Month wage</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {data.history.map((row) => (
                <tr key={`${row.effectiveFrom}-${row.monthlyWage}`} className="border-t border-border">
                  <td className="py-1">{formatDate(row.effectiveFrom)}</td>
                  <td className="py-1">
                    {row.effectiveTo ? formatDate(row.effectiveTo) : "current"}
                  </td>
                  <td className="py-1 text-right">₹{formatINR(row.monthlyWage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-sans text-[11px] text-muted-foreground">
            Wages are versioned, never overwritten — a past month&apos;s figures stay
            reconstructable.
          </p>
        </details>
      )}
    </div>
  );
}

/** 60 -> "1.00", 90 -> "1.50". The wireframe labels this field in hours. */
function formatBreak(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

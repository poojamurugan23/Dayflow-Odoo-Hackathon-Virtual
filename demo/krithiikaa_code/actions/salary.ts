"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentSalary } from "@/lib/payroll";
import { SALARY_COMPONENTS, computeComponents, componentsTotal, toPaise } from "@/lib/salary";
import { cleanString } from "@/lib/validation";
import type { WageState } from "@/lib/form-state";

/**
 * Salary mutations.
 *
 * ============================================================================
 * SALARY IS VERSIONED. NOTHING HERE UPDATES A WAGE IN PLACE.
 *
 * A raise inserts a NEW salary_structures row effective today and stamps
 * effective_to on the row it replaces. The old figures survive, which is the
 * only way a payslip for a past month can ever be reconstructed — and the
 * reason `monthly_wage` must never be the target of an UPDATE.
 *
 * The only writes are: one UPDATE closing the previous row's date range, one
 * INSERT of the new structure, its component RULES, and an audit_log row.
 * Nothing touches attendance or leave.
 * ============================================================================
 *
 * Why the service role rather than the admin's own session: migration 0006
 * revokes INSERT/UPDATE/DELETE on both salary tables from `authenticated`, so
 * there is no API path to a salary change at all — for employees or admins. That
 * makes this function the single way a wage can move, which in turn makes the
 * audit_log entry below a guarantee rather than a convention.
 */

const MAX_MONTHLY_WAGE = 100_000_000; // ₹10 crore/month — a typo guard, not a policy

export async function updateWage(_prev: WageState, formData: FormData): Promise<WageState> {
  const profileId = cleanString(formData.get("profileId"));
  const wageRaw = cleanString(formData.get("monthlyWage"));
  const note = typeof formData.get("note") === "string" ? String(formData.get("note")).trim() : "";

  if (!profileId) return { error: "Missing employee.", saved: false };

  const actor = await getCurrentUser();
  if (!actor) return { error: "Your session expired. Sign in again.", saved: false };

  // ADMIN ONLY — narrower than isManager (admin or hr), matching master plan
  // Part 5 and SRS 3.6.2, and matching is_admin() in the RLS policy. The wage
  // field is not rendered for anyone else, but hiding an input is not a control.
  if (actor.role !== "admin") {
    return { error: "Only an admin can change salary.", saved: false };
  }

  const monthlyWage = toPaise(Number(wageRaw));
  if (!Number.isFinite(monthlyWage) || monthlyWage <= 0) {
    return { error: "Enter a monthly wage greater than zero.", saved: false };
  }
  if (monthlyWage > MAX_MONTHLY_WAGE) {
    return { error: "That wage looks like a typo. Check the figure.", saved: false };
  }

  const existing = await getCurrentSalary(profileId);

  if (existing && toPaise(existing.monthlyWage) === monthlyWage) {
    return { error: "That's already the current wage.", saved: false };
  }

  const today = new Date().toISOString().slice(0, 10);

  // Recomputed server-side from the same pure function the browser used. The
  // client's arithmetic is a preview; this is the figure that gets stored.
  const components = computeComponents(monthlyWage);
  const total = componentsTotal(components);
  if (total !== monthlyWage) {
    // Unreachable by construction — the remainder absorbs rounding — so if it
    // ever fires, the rules are wrong and refusing to write is the right answer.
    return { error: "Components did not balance to the wage. Nothing was saved.", saved: false };
  }

  const admin = createAdminClient();

  // Close the outgoing structure FIRST. 0006 adds a unique index allowing only
  // one open row per person, so doing this in the other order would be refused
  // by the database — which is the point of the index.
  if (existing && existing.effectiveTo === null) {
    // A same-day change would otherwise produce a zero-length range ending
    // before it starts; keeping effective_to at the start date marks it as
    // superseded on the day it began.
    const closeOn = existing.effectiveFrom >= today ? existing.effectiveFrom : previousDay(today);

    const { error } = await admin
      .from("salary_structures")
      .update({ effective_to: closeOn })
      .eq("id", existing.id)
      .is("effective_to", null);

    if (error) return { error: "Could not close the previous salary. Nothing was saved.", saved: false };
  }

  const { data: schedule } = await admin.from("work_schedules").select("id").limit(1).maybeSingle();

  const { data: created, error: insertError } = await admin
    .from("salary_structures")
    .insert({
      profile_id: profileId,
      monthly_wage: monthlyWage,
      schedule_id: (schedule as { id: string } | null)?.id ?? null,
      effective_from: today,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    // Reopen the row we just closed, so a failure here does not leave the
    // employee with no current salary at all.
    if (existing && existing.effectiveTo === null) {
      await admin.from("salary_structures").update({ effective_to: null }).eq("id", existing.id);
    }
    return { error: "Could not save the new salary. Nothing was changed.", saved: false };
  }

  const structureId = (created as { id: string }).id;

  // Rules, not amounts — same as Phase 2's employee creation, and the reason a
  // wage change cannot leave stale money behind.
  const { error: componentError } = await admin.from("salary_components").insert(
    SALARY_COMPONENTS.map((rule) => ({
      structure_id: structureId,
      name: rule.name,
      computation_type: rule.computationType,
      value: rule.value,
      sort_order: rule.sortOrder,
    })),
  );

  if (componentError) {
    return {
      error: "Salary saved, but its components did not. Set the wage again.",
      saved: false,
    };
  }

  await admin.from("audit_log").insert({
    org_id: actor.orgId,
    actor_id: actor.id,
    entity: "salary_structures",
    entity_id: structureId,
    action: "wage_change",
    before: existing
      ? { monthly_wage: existing.monthlyWage, effective_from: existing.effectiveFrom }
      : null,
    after: {
      monthly_wage: monthlyWage,
      effective_from: today,
      note: note || null,
    },
  });

  revalidatePath(`/employees/${profileId}`);
  revalidatePath("/employees");
  revalidatePath("/profile");

  return { error: null, saved: true, effectiveFrom: today };
}

/** Yesterday, in YYYY-MM-DD. Date arithmetic in UTC: these are calendar dates,
 *  not instants, so a timezone shift must not move them. */
function previousDay(day: string): string {
  const time = Date.parse(`${day}T00:00:00Z`) - 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

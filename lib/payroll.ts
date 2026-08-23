import { createClient } from "@/lib/supabase/server";
import type { ComponentRule, StatutoryConfig } from "@/lib/salary";

/**
 * Salary and payable-day reads.
 *
 * Two things this file deliberately does NOT do:
 *
 *   It does not compute payable days. v_payable_days already derives them from
 *   v_daily_attendance, which already reflects approved leave. Recomputing here
 *   would create a second answer to "how many days is this person paid for",
 *   and the two would eventually disagree — which is the exact failure the whole
 *   derivation architecture exists to prevent.
 *
 *   It does not store component amounts. `salary_components` holds RULES
 *   (computation_type, value); the amounts are resolved from the wage at read
 *   time by lib/salary.ts. A wage change therefore cannot leave stale money
 *   behind, because there is no money stored to go stale.
 *
 * Visibility is RLS's job. After migration 0006 the SELECT policy on both salary
 * tables is `profile_id = auth.uid() or is_admin()`, so an employee asking for
 * someone else's structure gets no rows rather than a filtered answer.
 */

export type SalaryStructure = {
  id: string;
  profileId: string;
  monthlyWage: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  rules: ComponentRule[];
};

type RawStructure = {
  id: string;
  profile_id: string;
  monthly_wage: number | string;
  effective_from: string;
  effective_to: string | null;
};

type RawComponent = {
  structure_id: string;
  name: string;
  computation_type: string;
  value: number | string | null;
  sort_order: number | null;
};

/**
 * The structure in force today: the open-ended row, or the one whose range
 * covers today. Migration 0006 adds a unique index guaranteeing at most one
 * open row per person, so "the current salary" is a database fact rather than
 * an ordering convention here.
 */
export async function getCurrentSalary(profileId: string): Promise<SalaryStructure | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("salary_structures")
    .select("id, profile_id, monthly_wage, effective_from, effective_to")
    .eq("profile_id", profileId)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = (data ?? []) as RawStructure[];
  if (rows.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);

  // The OPEN row wins outright. Two wage changes on the same day leave the
  // superseded row with effective_to = today, so it still "covers today" by a
  // date comparison — and picking it would show the admin the wage they just
  // replaced. The unique index from 0006 guarantees there is at most one open
  // row, which is what makes this unambiguous rather than a lucky sort.
  const open = rows.find((r) => r.effective_to === null && r.effective_from <= today);
  const covering = rows.find(
    (r) => r.effective_from <= today && (r.effective_to === null || r.effective_to >= today),
  );

  // Falling back to the newest row covers a future-dated structure, which is
  // better shown than reported as "no salary".
  return withRules(open ?? covering ?? rows[0]);
}

/** Every structure for this person, newest first — the versioning history. */
export async function getSalaryHistory(profileId: string): Promise<SalaryStructure[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("salary_structures")
    .select("id, profile_id, monthly_wage, effective_from, effective_to")
    .eq("profile_id", profileId)
    .order("effective_from", { ascending: false });

  const rows = (data ?? []) as RawStructure[];
  return Promise.all(rows.map(withRules));
}

async function withRules(row: RawStructure): Promise<SalaryStructure> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("salary_components")
    .select("structure_id, name, computation_type, value, sort_order")
    .eq("structure_id", row.id)
    .order("sort_order");

  const rules = ((data ?? []) as RawComponent[]).map(
    (c): ComponentRule => ({
      name: c.name,
      computationType: c.computation_type as ComponentRule["computationType"],
      value: c.value === null ? null : Number(c.value),
      sortOrder: c.sort_order ?? 0,
    }),
  );

  return {
    id: row.id,
    profileId: row.profile_id,
    monthlyWage: Number(row.monthly_wage),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    rules,
  };
}

// ---------------------------------------------------------------------------
// Innovation 4 — payable days, READ not computed
// ---------------------------------------------------------------------------
export type PayableDays = {
  workingDays: number;
  absentDays: number;
  unpaidDays: number;
  payableDays: number;
  /** Days lost: the difference the strip is actually about. */
  lostDays: number;
};

/**
 * Straight out of v_payable_days.
 *
 * The chain behind this one row: a punch creates attendance_punches; an approved
 * leave_request makes v_daily_attendance report `leave`; v_payable_days counts
 * those statuses. So an unpaid leave approved in the Time Off screen shows up
 * here with no payroll code in between. That is the demo's closing argument, and
 * it only holds because this function is a SELECT.
 */
export async function getPayableDays(profileId: string): Promise<PayableDays | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("v_payable_days")
    .select("working_days, absent_days, unpaid_days, payable_days")
    .eq("profile_id", profileId)
    .maybeSingle();

  const row = data as {
    working_days: number | string;
    absent_days: number | string;
    unpaid_days: number | string;
    payable_days: number | string;
  } | null;
  if (!row) return null;

  const workingDays = Number(row.working_days);
  const payableDays = Number(row.payable_days);

  return {
    workingDays,
    absentDays: Number(row.absent_days),
    unpaidDays: Number(row.unpaid_days),
    payableDays,
    lostDays: Math.round((workingDays - payableDays) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Work schedule (wireframe image 2)
// ---------------------------------------------------------------------------
export type WorkSchedule = {
  name: string;
  daysPerWeek: number;
  hoursPerDay: number;
  breakMinutes: number;
  halfDayThreshold: number;
};

/**
 * The schedule attached to this salary structure, or the org's default.
 *
 * READ-ONLY everywhere this phase. Editing a schedule changes how
 * v_daily_attendance scores every past day for that person — a half-day
 * threshold moved from 4 hours to 5 silently reclassifies history — so it needs
 * effective-dating of its own, the same treatment salary got. Out of scope here;
 * the schema already carries schedule_id per structure to support it.
 */
export async function getWorkSchedule(structureId?: string): Promise<WorkSchedule | null> {
  const supabase = await createClient();

  if (structureId) {
    const { data } = await supabase
      .from("salary_structures")
      .select("schedule_id")
      .eq("id", structureId)
      .maybeSingle();

    const scheduleId = (data as { schedule_id: string | null } | null)?.schedule_id;
    if (scheduleId) {
      const { data: row } = await supabase
        .from("work_schedules")
        .select("name, days_per_week, hours_per_day, break_minutes, half_day_threshold")
        .eq("id", scheduleId)
        .maybeSingle();
      if (row) return toSchedule(row as RawSchedule);
    }
  }

  // Falls back to the org's only schedule. Every employee shares it at demo
  // scale, so this is the normal path rather than a repair path.
  const { data } = await supabase
    .from("work_schedules")
    .select("name, days_per_week, hours_per_day, break_minutes, half_day_threshold")
    .limit(1)
    .maybeSingle();

  return data ? toSchedule(data as RawSchedule) : null;
}

type RawSchedule = {
  name: string;
  days_per_week: number | string;
  hours_per_day: number | string;
  break_minutes: number | string;
  half_day_threshold: number | string;
};

function toSchedule(row: RawSchedule): WorkSchedule {
  return {
    name: row.name,
    daysPerWeek: Number(row.days_per_week),
    hoursPerDay: Number(row.hours_per_day),
    breakMinutes: Number(row.break_minutes),
    halfDayThreshold: Number(row.half_day_threshold),
  };
}

// ---------------------------------------------------------------------------
// Statutory config
// ---------------------------------------------------------------------------
export async function getStatutoryConfig(): Promise<StatutoryConfig> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("statutory_config")
    .select("pf_employee_pct, pf_employer_pct, professional_tax")
    .limit(1)
    .maybeSingle();

  const row = data as {
    pf_employee_pct: number | string;
    pf_employer_pct: number | string;
    professional_tax: number | string;
  } | null;

  // Falls back to the statutory defaults rather than rendering blanks: these are
  // the figures in the master plan and in seed.sql, so a missing config row is a
  // setup gap, not a reason to show an employee a zero deduction.
  return {
    pfEmployeePct: row ? Number(row.pf_employee_pct) : 12,
    pfEmployerPct: row ? Number(row.pf_employer_pct) : 12,
    professionalTax: row ? Number(row.professional_tax) : 200,
  };
}

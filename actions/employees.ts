"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { allocateLoginId, generateTempPassword } from "@/lib/login-id";
import { SALARY_COMPONENTS } from "@/lib/salary";
import { cleanString, isEmail } from "@/lib/validation";
import type { EditState, NewEmployeeState } from "@/lib/form-state";

/**
 * Employee mutations. Every export authorises the CALLER before touching
 * anything — the role checks in the UI only hide buttons, they are not the gate.
 */

function rawString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

// ---------------------------------------------------------------------------
// Field allowlists — the actual permission model for editing.
//
// `role` is absent from BOTH lists on purpose. Letting it through, even for an
// admin, turns one missing check into privilege escalation; role changes need
// their own audited flow, not a general profile save.
// ---------------------------------------------------------------------------
const RESUME_FIELDS = ["about", "job_love", "interests", "skills", "certifications"] as const;

/** Stored as text[]; the form sends them comma-separated. */
const ARRAY_FIELDS = new Set<string>(["skills", "certifications"]);

const MANAGER_PROFILE_FIELDS = [
  "full_name",
  "email",
  "phone",
  "job_position",
  "department",
  "location",
  "employee_code",
  "manager_id",
  "date_of_joining",
  ...RESUME_FIELDS,
] as const;

/**
 * SRS 3.3.2 limits an employee to address, phone and picture. The resume
 * fields are added on top of that, deliberately: "About", "What I love about my
 * job" and "My interests" are first-person writing, and a bio composed by HR on
 * someone's behalf is not a feature. Bank and job details stay HR-only.
 * To revert to the letter of the SRS, drop ...RESUME_FIELDS from this list.
 */
const SELF_PROFILE_FIELDS = ["phone", ...RESUME_FIELDS] as const;

const MANAGER_PRIVATE_FIELDS = [
  "dob",
  "residing_address",
  "nationality",
  "personal_email",
  "gender",
  "marital_status",
  "bank_account_no",
  "bank_name",
  "ifsc",
  "pan_no",
  "uan_no",
] as const;

/** Address only. Bank details deliberately excluded — those need HR. */
const SELF_PRIVATE_FIELDS = ["residing_address"] as const;

// ---------------------------------------------------------------------------
// Create employee (HR/admin) — master plan Part 6 onboarding
// ---------------------------------------------------------------------------
export async function createEmployee(
  _prev: NewEmployeeState,
  formData: FormData,
): Promise<NewEmployeeState> {
  const actor = await getCurrentUser();
  if (!actor) return { error: "Your session expired. Sign in again." };
  if (!actor.isManager) {
    // Server-side guard. The NEW button is hidden for employees, but hiding a
    // button is not access control.
    return { error: "Only HR and admins can add employees." };
  }

  const fullName = cleanString(formData.get("fullName"));
  const email = cleanString(formData.get("email")).toLowerCase();
  const phone = cleanString(formData.get("phone"));
  const jobPosition = cleanString(formData.get("jobPosition"));
  const department = cleanString(formData.get("department"));
  const location = cleanString(formData.get("location"));
  const managerId = cleanString(formData.get("managerId"));
  const dateOfJoining = cleanString(formData.get("dateOfJoining"));
  const monthlyWageRaw = cleanString(formData.get("monthlyWage"));

  if (!fullName) return { error: "Enter the employee's full name." };
  if (!email || !isEmail(email)) return { error: "Enter a valid email address." };
  if (!jobPosition) return { error: "Enter a job position." };
  if (!dateOfJoining || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfJoining)) {
    return { error: "Choose a date of joining." };
  }

  const monthlyWage = Number(monthlyWageRaw);
  if (!Number.isFinite(monthlyWage) || monthlyWage <= 0) {
    return { error: "Enter a monthly wage greater than zero." };
  }

  // ---- SERVER ONLY ------------------------------------------------------
  // The service role is required here and nowhere else in this file: there is
  // no session for the new employee yet, so no RLS policy could authorise
  // writing their profile. This module is "use server", so none of it can be
  // bundled into the client. See lib/supabase/admin.ts.
  // ----------------------------------------------------------------------
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created?.user) {
    if (createError && /already|exists|registered/i.test(createError.message)) {
      return { error: "Someone with that email already has an account." };
    }
    return { error: "Could not create the account. Try again." };
  }

  const userId = created.user.id;
  const undoAuthUser = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  const loginId = await allocateLoginId(
    admin,
    actor.orgId,
    fullName,
    dateOfJoining,
    actor.organization?.code ?? "XX",
  );

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    org_id: actor.orgId,
    login_id: loginId,
    full_name: fullName,
    email,
    phone: phone || null,
    role: "employee",
    job_position: jobPosition,
    department: department || null,
    location: location || null,
    manager_id: managerId || null,
    date_of_joining: dateOfJoining,
    // Phase 1's forced-change screen picks this up on their first sign-in.
    must_change_password: true,
  });

  if (profileError) {
    await undoAuthUser();
    return { error: "Could not create the employee profile. Try again." };
  }

  // From here on the employee exists and can log in. The remaining inserts are
  // supporting records; if one fails we surface it but do NOT delete the
  // employee, because a half-built employee is easier to repair than a deleted
  // auth user whose id other rows may already reference.
  const problems: string[] = [];

  const { error: privateError } = await admin.from("private_info").insert({ profile_id: userId });
  if (privateError) problems.push("personal details");

  const salaryProblem = await insertSalaryStructure(admin, userId, monthlyWage, actor.id);
  if (salaryProblem) problems.push("salary structure");

  const allocationProblem = await insertLeaveAllocations(admin, userId, actor.orgId);
  if (allocationProblem) problems.push("leave allocations");

  await admin.from("audit_log").insert({
    org_id: actor.orgId,
    actor_id: actor.id,
    entity: "profiles",
    entity_id: userId,
    action: "create",
    after: {
      login_id: loginId,
      full_name: fullName,
      email,
      job_position: jobPosition,
      department: department || null,
      monthly_wage: monthlyWage,
    },
  });

  revalidatePath("/employees");

  return {
    error: problems.length
      ? `Employee created, but these need attention: ${problems.join(", ")}.`
      : null,
    created: { fullName, loginId, tempPassword, profileId: userId },
  };
}

/** Default structure plus the six components from the master plan's rules. */
async function insertSalaryStructure(
  admin: SupabaseClient,
  profileId: string,
  monthlyWage: number,
  createdBy: string,
): Promise<boolean> {
  const { data: schedule } = await admin.from("work_schedules").select("id").limit(1).maybeSingle();

  const { data: structure, error } = await admin
    .from("salary_structures")
    .insert({
      profile_id: profileId,
      monthly_wage: monthlyWage,
      schedule_id: (schedule as { id: string } | null)?.id ?? null,
      effective_from: new Date().toISOString().slice(0, 10),
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !structure) return true;

  // Rules only — amounts stay derived, so a wage change recomputes rather than
  // leaving stale numbers behind.
  const { error: componentError } = await admin.from("salary_components").insert(
    SALARY_COMPONENTS.map((rule) => ({
      structure_id: (structure as { id: string }).id,
      name: rule.name,
      computation_type: rule.computationType,
      value: rule.value,
      sort_order: rule.sortOrder,
    })),
  );

  return Boolean(componentError);
}

/** 24 Paid and 7 Sick days for the current year. */
async function insertLeaveAllocations(
  admin: SupabaseClient,
  profileId: string,
  orgId: string,
): Promise<boolean> {
  const { data: types } = await admin
    .from("leave_types")
    .select("id, code")
    .eq("org_id", orgId)
    .in("code", ["paid", "sick"]);

  const rows = (types as { id: string; code: string }[] | null)?.map((type) => ({
    profile_id: profileId,
    leave_type_id: type.id,
    year: new Date().getFullYear(),
    allocated_days: type.code === "paid" ? 24 : 7,
  }));

  if (!rows?.length) return true;
  const { error } = await admin.from("leave_allocations").insert(rows);
  return Boolean(error);
}

// ---------------------------------------------------------------------------
// Edit profile / private info
// ---------------------------------------------------------------------------
export async function updateEmployee(_prev: EditState, formData: FormData): Promise<EditState> {
  const targetId = cleanString(formData.get("targetId"));
  if (!targetId) return { error: "Missing employee.", saved: false };

  const actor = await getCurrentUser();
  if (!actor) return { error: "Your session expired. Sign in again.", saved: false };

  const isSelf = actor.id === targetId;
  if (!actor.isManager && !isSelf) {
    return { error: "You can only edit your own profile.", saved: false };
  }

  // Which fields are permitted is decided HERE, from the actor's role — never
  // from what the form happened to submit. Anything outside the list is ignored
  // even if a crafted request includes it.
  const profileFields = actor.isManager ? MANAGER_PROFILE_FIELDS : SELF_PROFILE_FIELDS;
  const privateFields = actor.isManager ? MANAGER_PRIVATE_FIELDS : SELF_PRIVATE_FIELDS;

  const profilePatch = collect(formData, profileFields);
  const privatePatch = collect(formData, privateFields);

  const admin = createAdminClient();

  if (Object.keys(profilePatch).length > 0) {
    if (typeof profilePatch.email === "string" && !isEmail(profilePatch.email)) {
      return { error: "Enter a valid email address.", saved: false };
    }
    if (typeof profilePatch.full_name === "string" && !profilePatch.full_name) {
      return { error: "Name cannot be empty.", saved: false };
    }

    // `profiles` has no UPDATE policy by design — a blanket one would let an
    // employee set their own role. The authorisation above replaces it.
    const { error } = await admin.from("profiles").update(profilePatch).eq("id", targetId);
    if (error) return { error: "Could not save those details. Try again.", saved: false };
  }

  if (Object.keys(privatePatch).length > 0) {
    if (actor.isManager) {
      // Migration 0003 revoked INSERT/UPDATE on private_info from
      // `authenticated`, so even a manager cannot write it through their own
      // session. That is the point: the direct-API path is closed for everyone
      // and bank changes only happen through this authorised action.
      const { error } = await admin
        .from("private_info")
        .upsert({ profile_id: targetId, ...privatePatch }, { onConflict: "profile_id" });
      if (error) return { error: "Could not save personal details. Try again.", saved: false };
    } else {
      // The owner keeps their own client on purpose. 0003 grants
      // `authenticated` UPDATE on residing_address and nothing else, and the
      // RLS policy pins it to their own row — so even if the allowlist above
      // were wrong, Postgres would still refuse a bank column.
      const supabase = await createClient();
      const { data: touched, error } = await supabase
        .from("private_info")
        .update(privatePatch)
        .eq("profile_id", targetId)
        .select("profile_id");

      if (error) return { error: "Could not save personal details. Try again.", saved: false };

      if (!touched?.length) {
        // No row yet. One is created with every employee, so this is a repair
        // path rather than a normal one, and it needs the service role.
        const { error: backfill } = await admin
          .from("private_info")
          .upsert({ profile_id: targetId, ...privatePatch }, { onConflict: "profile_id" });
        if (backfill) return { error: "Could not save personal details. Try again.", saved: false };
      }
    }
  }

  if (Object.keys(profilePatch).length === 0 && Object.keys(privatePatch).length === 0) {
    return { error: "Nothing to save.", saved: false };
  }

  await admin.from("audit_log").insert({
    org_id: actor.orgId,
    actor_id: actor.id,
    entity: "profiles",
    entity_id: targetId,
    action: isSelf && !actor.isManager ? "self_update" : "update",
    after: { ...profilePatch, ...privatePatch },
  });

  revalidatePath(`/employees/${targetId}`);
  revalidatePath("/employees");
  return { error: null, saved: true };
}

/** Pull only allowlisted keys out of the form, normalising "" to null. */
function collect(
  formData: FormData,
  allowed: readonly string[],
): Record<string, string | string[] | null> {
  const patch: Record<string, string | string[] | null> = {};
  for (const field of allowed) {
    if (!formData.has(field)) continue;
    const value = rawString(formData.get(field)).trim();

    if (ARRAY_FIELDS.has(field)) {
      // Comma-separated in, text[] out. Empty means an empty array, not null,
      // because the columns are NOT NULL DEFAULT '{}'.
      patch[field] = value
        ? value.split(",").map((part) => part.trim()).filter(Boolean)
        : [];
      continue;
    }

    patch[field] = value === "" ? null : value;
  }
  return patch;
}

// ---------------------------------------------------------------------------
// Avatar upload
// ---------------------------------------------------------------------------
export async function updateAvatar(_prev: EditState, formData: FormData): Promise<EditState> {
  const targetId = cleanString(formData.get("targetId"));
  const file = formData.get("avatar");

  if (!targetId) return { error: "Missing employee.", saved: false };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first.", saved: false };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "That image is larger than 2 MB. Choose a smaller one.", saved: false };
  }
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Use a PNG, JPEG, WebP or GIF image.", saved: false };
  }

  const actor = await getCurrentUser();
  if (!actor) return { error: "Your session expired. Sign in again.", saved: false };
  if (!actor.isManager && actor.id !== targetId) {
    return { error: "You can only change your own picture.", saved: false };
  }

  const admin = createAdminClient();
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  // Overwrite a single stable path per profile so old avatars do not accumulate.
  const path = `${targetId}/avatar.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: "Could not upload that image. Try again.", saved: false };

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);

  // Cache-bust, since the storage path is reused on every upload.
  const versioned = `${publicUrl}?v=${Date.now()}`;

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: versioned })
    .eq("id", targetId);

  if (error) return { error: "Uploaded, but could not save it to the profile.", saved: false };

  revalidatePath(`/employees/${targetId}`);
  revalidatePath("/employees");
  revalidatePath("/", "layout");
  return { error: null, saved: true };
}

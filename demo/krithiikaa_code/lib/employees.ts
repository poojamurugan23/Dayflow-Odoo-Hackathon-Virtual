import { createClient } from "@/lib/supabase/server";

/**
 * Employee reads. Every query here uses the CALLER's client, so RLS decides
 * what comes back: an employee sees one row, admin/HR see the whole org. There
 * is no `where org_id = ...` or role branch in this file on purpose — adding one
 * would imply the filtering happens in app code, and it does not.
 */

export type EmployeeCard = {
  id: string;
  fullName: string;
  loginId: string;
  jobPosition: string | null;
  department: string | null;
  avatarUrl: string | null;
};

type EmployeeCardRow = {
  id: string;
  full_name: string;
  login_id: string;
  job_position: string | null;
  department: string | null;
  avatar_url: string | null;
};

export async function listEmployees(): Promise<EmployeeCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, login_id, job_position, department, avatar_url")
    .is("exit_date", null)
    .order("full_name");

  if (error || !data) return [];

  return (data as EmployeeCardRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    loginId: row.login_id,
    jobPosition: row.job_position,
    department: row.department,
    avatarUrl: row.avatar_url,
  }));
}

export type EmployeeDetail = {
  id: string;
  fullName: string;
  loginId: string;
  employeeCode: string | null;
  email: string;
  phone: string | null;
  jobPosition: string | null;
  department: string | null;
  location: string | null;
  avatarUrl: string | null;
  dateOfJoining: string;
  managerId: string | null;
  managerName: string | null;
  companyName: string | null;
  /** Resume tab content (SRS 3.3.1), added in migration 0003. */
  about: string | null;
  jobLove: string | null;
  interests: string | null;
  skills: string[];
  certifications: string[];
};

export type PrivateInfo = {
  dob: string | null;
  residingAddress: string | null;
  nationality: string | null;
  personalEmail: string | null;
  gender: string | null;
  maritalStatus: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  ifsc: string | null;
  panNo: string | null;
  uanNo: string | null;
};

type DetailRow = {
  id: string;
  full_name: string;
  login_id: string;
  employee_code: string | null;
  email: string;
  phone: string | null;
  job_position: string | null;
  department: string | null;
  location: string | null;
  avatar_url: string | null;
  date_of_joining: string;
  manager_id: string | null;
  about?: string | null;
  job_love?: string | null;
  interests?: string | null;
  skills?: string[] | null;
  certifications?: string[] | null;
  organizations: { name: string } | null;
};

/**
 * Result of an employee fetch. `forbidden` and `failed` are deliberately
 * different: RLS returning no row is a permission answer, while a broken query
 * is a bug. Collapsing both into null once made a missing column render as
 * "you can't view this profile", which sent me looking in the wrong place.
 */
export type EmployeeResult =
  | { kind: "ok"; employee: EmployeeDetail }
  | { kind: "forbidden" }
  | { kind: "failed"; message: string };

const BASE_COLUMNS =
  "id, full_name, login_id, employee_code, email, phone, job_position, department, location, avatar_url, date_of_joining, manager_id, organizations(name)";
const RESUME_COLUMNS = "about, job_love, interests, skills, certifications";

export async function getEmployee(id: string): Promise<EmployeeResult> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("profiles")
    .select(`${BASE_COLUMNS}, ${RESUME_COLUMNS}`)
    .eq("id", id)
    .maybeSingle();

  // 42703 = undefined_column. Migration 0003 adds the resume fields; until it
  // has been applied everywhere, fall back so the profile still renders instead
  // of failing whole. Safe to delete once 0003 is applied in every environment.
  if (error?.code === "42703") {
    ({ data, error } = await supabase
      .from("profiles")
      .select(BASE_COLUMNS)
      .eq("id", id)
      .maybeSingle());
  }

  if (error) return { kind: "failed", message: error.message };

  // Cast: without generated database types supabase-js cannot infer the shape
  // of the embedded `organizations` relation. The select list is the contract.
  const row = data as DetailRow | null;
  if (!row) return { kind: "forbidden" };

  let managerName: string | null = null;
  if (row.manager_id) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", row.manager_id)
      .maybeSingle();
    managerName = (mgr as { full_name: string } | null)?.full_name ?? null;
  }

  return {
    kind: "ok",
    employee: {
      id: row.id,
      fullName: row.full_name,
      loginId: row.login_id,
      employeeCode: row.employee_code,
      email: row.email,
      phone: row.phone,
      jobPosition: row.job_position,
      department: row.department,
      location: row.location,
      avatarUrl: row.avatar_url,
      dateOfJoining: row.date_of_joining,
      managerId: row.manager_id,
      managerName,
      companyName: row.organizations?.name ?? null,
      about: row.about ?? null,
      jobLove: row.job_love ?? null,
      interests: row.interests ?? null,
      skills: row.skills ?? [],
      certifications: row.certifications ?? [],
    },
  };
}

type PrivateRow = {
  dob: string | null;
  residing_address: string | null;
  nationality: string | null;
  personal_email: string | null;
  gender: string | null;
  marital_status: string | null;
  bank_account_no: string | null;
  bank_name: string | null;
  ifsc: string | null;
  pan_no: string | null;
  uan_no: string | null;
};

/** null means RLS withheld the row (or it does not exist yet). */
export async function getPrivateInfo(profileId: string): Promise<PrivateInfo | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("private_info")
    .select(
      "dob, residing_address, nationality, personal_email, gender, marital_status, bank_account_no, bank_name, ifsc, pan_no, uan_no",
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  const row = data as PrivateRow | null;
  if (!row) return null;

  return {
    dob: row.dob,
    residingAddress: row.residing_address,
    nationality: row.nationality,
    personalEmail: row.personal_email,
    gender: row.gender,
    maritalStatus: row.marital_status,
    bankAccountNo: row.bank_account_no,
    bankName: row.bank_name,
    ifsc: row.ifsc,
    panNo: row.pan_no,
    uanNo: row.uan_no,
  };
}

/** Candidate managers for the New Employee form. */
export async function listManagerOptions(): Promise<{ id: string; label: string }[]> {
  const employees = await listEmployees();
  return employees.map((e) => ({
    id: e.id,
    label: e.jobPosition ? `${e.fullName} — ${e.jobPosition}` : e.fullName,
  }));
}

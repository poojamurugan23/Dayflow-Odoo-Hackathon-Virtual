import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "hr" | "employee";

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  loginId: string;
  role: UserRole;
  jobPosition: string | null;
  department: string | null;
  avatarUrl: string | null;
  organization: { name: string; code: string; logoUrl: string | null } | null;
  /** admin or hr — mirrors the SQL is_manager() used by the RLS policies. */
  isManager: boolean;
};

/** Shape of the row the query below returns, including the embedded org. */
type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  login_id: string;
  role: UserRole;
  job_position: string | null;
  department: string | null;
  avatar_url: string | null;
  organizations: { name: string; code: string; logo_url: string | null } | null;
};

/**
 * The signed-in user's profile plus their organization, read once per request.
 *
 * This is a convenience for rendering, NOT an authorization check. Access is
 * decided by RLS in Postgres — `role` here only drives what the UI bothers to
 * show. A tampered client still cannot read rows its policies forbid.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, login_id, role, job_position, department, avatar_url, organizations(name, code, logo_url)",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Cast rather than `any`: without generated database types, supabase-js
  // cannot infer the shape of the embedded `organizations` relation. The
  // select list above is the contract for ProfileRow.
  const profile = data as ProfileRow | null;
  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    loginId: profile.login_id,
    role: profile.role,
    jobPosition: profile.job_position,
    department: profile.department,
    avatarUrl: profile.avatar_url,
    organization: profile.organizations
      ? {
          name: profile.organizations.name,
          code: profile.organizations.code,
          logoUrl: profile.organizations.logo_url,
        }
      : null,
    isManager: profile.role === "admin" || profile.role === "hr",
  };
}

/** "Priya Sharma" -> "PS", for the avatar fallback. */
export function initials(fullName: string): string {
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function roleLabel(role: UserRole): string {
  if (role === "admin") return "Admin";
  if (role === "hr") return "HR Officer";
  return "Employee";
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanString, deriveOrgCode, isEmail, passwordProblem } from "@/lib/validation";
import type { AuthFormState } from "@/lib/form-state";

/**
 * Every auth mutation lives here. This module is "use server", so none of it
 * can be bundled into the client — which is what lets it safely reach for the
 * service role client where RLS has to be bypassed.
 */

const DASHBOARD = "/employees";
const CHANGE_PASSWORD = "/change-password";

/**
 * Deliberately identical whether the account does not exist or the password is
 * wrong. A distinct "no such login ID" message would turn the sign-in form into
 * an oracle for enumerating valid login IDs.
 */
const BAD_CREDENTIALS = "Those credentials don't match. Try again.";

/** Passwords must not be trimmed or whitespace-collapsed — spaces are legal. */
function rawString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

// ---------------------------------------------------------------------------
// Sign in — accepts login ID or email (SRS 3.1.2)
// ---------------------------------------------------------------------------
export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const identifier = cleanString(formData.get("identifier"));
  const password = rawString(formData.get("password"));

  if (!identifier || !password) {
    return { error: "Enter your login ID or email, and your password." };
  }

  let email = identifier.toLowerCase();

  if (!isEmail(identifier)) {
    // `profiles` is unreadable to anonymous callers by design, so resolving a
    // login ID to an email needs the service role. The email is used only to
    // call signInWithPassword; it is never returned to the browser.
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("email")
      .eq("login_id", identifier.toUpperCase())
      .maybeSingle();

    if (!data?.email) return { error: BAD_CREDENTIALS };
    email = data.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: BAD_CREDENTIALS };

  // Resolve the destination HERE rather than redirecting to the dashboard and
  // letting middleware bounce a must_change_password user onwards.
  //
  // That bounce is a real trap: a server action redirect makes the router fetch
  // the target, middleware answers with a second redirect, and Next renders the
  // new content while leaving the OLD url in the address bar. The user ends up
  // on /employees showing the change-password form, and every later submit from
  // that desynced page silently fails.
  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", data.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");
  redirect(profile?.must_change_password ? CHANGE_PASSWORD : DASHBOARD);
}

// ---------------------------------------------------------------------------
// Company sign up — registers an ORGANIZATION and its first admin.
//
// Deliberate deviation from SRS 3.1.1, which allows self-registration with a
// role picker. That would let anyone self-assign HR and read every salary in
// the company. Employees are created by HR in a later phase; there is no role
// selector anywhere in this flow.
// ---------------------------------------------------------------------------
export async function signUpCompany(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const companyName = cleanString(formData.get("companyName"));
  const adminName = cleanString(formData.get("adminName"));
  const email = cleanString(formData.get("email")).toLowerCase();
  const phone = cleanString(formData.get("phone"));
  const password = rawString(formData.get("password"));
  const confirmPassword = rawString(formData.get("confirmPassword"));

  // Server-side validation. The client indicator is a convenience, not the gate.
  if (!companyName) return { error: "Enter your company name." };
  if (!adminName) return { error: "Enter your name." };
  if (!email || !isEmail(email)) return { error: "Enter a valid email address." };

  const pwProblem = passwordProblem(password);
  if (pwProblem) return { error: pwProblem };
  if (password !== confirmPassword) return { error: "Those passwords do not match." };

  const admin = createAdminClient();
  const orgCode = deriveOrgCode(companyName);
  const joinDate = new Date().toISOString().slice(0, 10);

  // Logo upload is accepted but not stored yet — Storage wiring is a later
  // phase, so a deterministic placeholder stands in. The form says so too.
  const logoUrl = `https://placehold.co/128x128/1C1C21/F4F4F5?text=${encodeURIComponent(orgCode)}`;

  // 1. Auth user. Must come first: profiles.id references auth.users.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: adminName },
  });

  if (createError || !created?.user) {
    if (createError && /already|exists|registered/i.test(createError.message)) {
      return { error: "An account with that email already exists. Sign in instead." };
    }
    return { error: "Could not create your account. Try again." };
  }

  const userId = created.user.id;

  // Auth user creation and the table writes cannot share one transaction,
  // because the first goes through GoTrue and the rest through Postgres. So
  // each failure below unwinds what came before it by hand.
  const deleteAuthUser = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  // 2. Organization
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: companyName, code: orgCode, logo_url: logoUrl })
    .select("id")
    .single();

  if (orgError || !org) {
    await deleteAuthUser();
    return { error: "Could not create your company. Try again." };
  }

  const deleteOrg = async () => {
    await admin.from("organizations").delete().eq("id", org.id);
  };

  // 3. Statutory config — PF 12/12 and professional tax 200 come from defaults.
  const { error: configError } = await admin.from("statutory_config").insert({ org_id: org.id });
  if (configError) {
    await deleteOrg();
    await deleteAuthUser();
    return { error: "Could not set up payroll defaults. Try again." };
  }

  // 4. Login ID via the SQL function, then the admin profile.
  const loginId = await allocateLoginId(admin, org.id, adminName, joinDate, orgCode);

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    org_id: org.id,
    login_id: loginId,
    full_name: adminName,
    email,
    phone: phone || null,
    role: "admin",
    job_position: "Administrator",
    department: "Human Resources",
    date_of_joining: joinDate,
    // The admin chose this password themselves, so nothing to force.
    must_change_password: false,
  });

  if (profileError) {
    await admin.from("statutory_config").delete().eq("org_id", org.id);
    await deleteOrg();
    await deleteAuthUser();
    return { error: "Could not create your admin profile. Try again." };
  }

  // 5. Sign the new admin in.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // The company exists and is valid; only the session failed. Send them to
    // sign in rather than rolling back a good registration.
    redirect("/sign-in");
  }

  revalidatePath("/", "layout");
  redirect(DASHBOARD);
}

/**
 * Ask Postgres for the next login ID, then make sure it is actually free.
 *
 * generate_login_id() derives the serial from a per-year COUNT, so two orgs
 * that share a derived code can produce the same ID (e.g. two "Odoo India"
 * companies whose first admin has the same initials and joining year). login_id
 * is UNIQUE, so that would fail the insert. Bump the trailing serial instead.
 */
async function allocateLoginId(
  admin: SupabaseClient,
  orgId: string,
  fullName: string,
  joinDate: string,
  orgCode: string,
): Promise<string> {
  const { data } = await admin.rpc("generate_login_id", {
    p_org: orgId,
    p_name: fullName,
    p_join: joinDate,
  });

  let candidate =
    typeof data === "string" && data.length > 0
      ? data
      : // Fallback if the function is unavailable for any reason.
        `${orgCode}${fullName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${joinDate.slice(0, 4)}0001`;

  for (let attempt = 0; attempt < 50; attempt++) {
    const { data: clash } = await admin
      .from("profiles")
      .select("id")
      .eq("login_id", candidate)
      .maybeSingle();

    if (!clash) return candidate;

    const match = candidate.match(/^(.*)(\d{4})$/);
    if (!match) return `${candidate}${attempt + 1}`;
    candidate = match[1] + String(Number(match[2]) + 1).padStart(4, "0");
  }

  return candidate;
}

// ---------------------------------------------------------------------------
// Forced password change
// ---------------------------------------------------------------------------
export async function changePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = rawString(formData.get("password"));
  const confirmPassword = rawString(formData.get("confirmPassword"));

  const pwProblem = passwordProblem(password);
  if (pwProblem) return { error: pwProblem };
  if (password !== confirmPassword) return { error: "Those passwords do not match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: updateError.message || "Could not update your password. Try again." };
  }

  // `profiles` has a SELECT policy but deliberately NO UPDATE policy: a blanket
  // update policy would let an employee set their own role to 'admin'. Clearing
  // this one flag therefore goes through the service role, from server code.
  const admin = createAdminClient();
  const { error: flagError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (flagError) {
    return {
      error: "Your password was changed, but your account state did not update. Contact HR.",
    };
  }

  revalidatePath("/", "layout");
  redirect(DASHBOARD);
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}

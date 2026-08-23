import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * The root is an entry point, not a page.
 *
 * Master plan Part 5 lists Sign In as screen 1 — there is no marketing landing
 * page in scope — so `/` just routes you to the right place. The Phase 0
 * placeholder card lived here and was a dead end: it rendered fine but linked
 * nowhere, so there was no way to reach sign-in from the root URL.
 *
 * Branding is not lost: the (auth) layout shows the Dayflow name and tagline
 * above the sign-in card.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Send a first-time user straight to the password change rather than to
  // /employees, which middleware would only bounce back again.
  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile?.must_change_password ? "/change-password" : "/employees");
}

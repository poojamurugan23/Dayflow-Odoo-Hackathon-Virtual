import { createClient } from "@supabase/supabase-js";

/**
 * ============================ SERVER ONLY ============================
 *
 * This client uses the service role / secret key and therefore BYPASSES
 * EVERY RLS POLICY. It can read and write every salary, PAN number, and
 * bank account in the database.
 *
 * This code path is server-only. Two things enforce that:
 *
 *  1. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so Next never
 *     inlines it into a client bundle. Even if this module were imported by
 *     a Client Component, the key would be `undefined` there — the secret
 *     cannot physically reach the browser.
 *  2. The guard below throws immediately if this ever runs in a browser,
 *     so the mistake is loud instead of silent.
 *
 * Only import this from files that are already server-bound: `"use server"`
 * action modules, Route Handlers, or Server Components.
 *
 * Legitimate uses, and why RLS has to be bypassed for each:
 *  - Sign-up: writes the very first admin profile. There is no session yet,
 *    so no policy could authorise it.
 *  - Login-ID sign-in: resolves a login ID to an email before the user is
 *    authenticated. `profiles` is unreadable to anonymous callers by design.
 *  - Clearing must_change_password: `profiles` has no UPDATE policy on
 *    purpose — see the note in actions/auth.ts.
 * =====================================================================
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() was called in the browser. The service role key bypasses RLS and must never leave the server.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See README.md for setup.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

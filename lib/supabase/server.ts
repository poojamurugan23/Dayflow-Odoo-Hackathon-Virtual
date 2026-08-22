import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Uses the anon key, so every query is still subject to RLS — the policies in
 * supabase/migrations/0001_init.sql are the authorization layer, not app code.
 *
 * Must be awaited: `cookies()` is async in Next 15.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Session refresh is handled by
          // middleware instead, so this is safe to swallow.
        }
      },
    },
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See README.md for setup.`);
  }
  return value;
}

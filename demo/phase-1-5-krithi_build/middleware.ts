import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pages in the (auth) group. Reachable only when signed out — except
 *  /change-password, which is the one authenticated page living there. */
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/change-password"];

/** Pages in the (app) group. Require a session. */
const PROTECTED_PREFIXES = ["/employees", "/attendance", "/time-off", "/profile"];

const CHANGE_PASSWORD = "/change-password";
const DASHBOARD = "/employees";
const SIGN_IN = "/sign-in";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mutated by setAll below when Supabase rotates the session cookies. Every
  // response we return must carry these, or the refreshed session is lost and
  // the user gets bounced back to sign-in on the next request.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() — not getSession() — because it revalidates the JWT with the
  // auth server. getSession() trusts the cookie, which is forgeable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isProtected = PROTECTED_PREFIXES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  // --- Signed out -----------------------------------------------------------
  if (!user) {
    if (isProtected || pathname === CHANGE_PASSWORD) {
      return redirectPreservingCookies(request, response, SIGN_IN);
    }
    return response;
  }

  // --- Signed in ------------------------------------------------------------
  // Only pay for the profile lookup on routes whose outcome depends on it.
  // The public landing page does not.
  if (!isProtected && !isAuthRoute) {
    return response;
  }

  // RLS lets a user read their own profile row (policy "read own or manage all").
  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  // A signed-in auth user with no profile row is a half-finished sign-up.
  // Send them to sign-in rather than looping them through the app shell.
  if (!profile) {
    return redirectPreservingCookies(request, response, SIGN_IN);
  }

  if (profile.must_change_password) {
    // Locked to /change-password until the temporary password is replaced.
    if (pathname !== CHANGE_PASSWORD) {
      return redirectPreservingCookies(request, response, CHANGE_PASSWORD);
    }
    return response;
  }

  // Nothing to change, so the (auth) pages are pointless here.
  if (isAuthRoute) {
    return redirectPreservingCookies(request, response, DASHBOARD);
  }

  return response;
}

/**
 * NextResponse.redirect() starts a fresh response, so any session cookies
 * Supabase just refreshed would be dropped. Copy them across.
 */
function redirectPreservingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

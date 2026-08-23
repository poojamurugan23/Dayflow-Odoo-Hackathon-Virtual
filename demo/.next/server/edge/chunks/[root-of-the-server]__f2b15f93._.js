(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f2b15f93._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
/** Pages in the (auth) group. Reachable only when signed out — except
 *  /change-password, which is the one authenticated page living there. */ const AUTH_ROUTES = [
    "/sign-in",
    "/sign-up",
    "/change-password"
];
/** Pages in the (app) group. Require a session. */ const PROTECTED_PREFIXES = [
    "/employees",
    "/attendance",
    "/time-off",
    "/profile"
];
const CHANGE_PASSWORD = "/change-password";
const DASHBOARD = "/employees";
const SIGN_IN = "/sign-in";
async function middleware(request) {
    const { pathname } = request.nextUrl;
    // Mutated by setAll below when Supabase rotates the session cookies. Every
    // response we return must carry these, or the refreshed session is lost and
    // the user gets bounced back to sign-in on the next request.
    let response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll () {
                return request.cookies.getAll();
            },
            setAll (cookiesToSet) {
                for (const { name, value } of cookiesToSet){
                    request.cookies.set(name, value);
                }
                response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request
                });
                for (const { name, value, options } of cookiesToSet){
                    response.cookies.set(name, value, options);
                }
            }
        }
    });
    // getUser() — not getSession() — because it revalidates the JWT with the
    // auth server. getSession() trusts the cookie, which is forgeable.
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthRoute = AUTH_ROUTES.some((r)=>pathname === r || pathname.startsWith(`${r}/`));
    const isProtected = PROTECTED_PREFIXES.some((r)=>pathname === r || pathname.startsWith(`${r}/`));
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
    const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", user.id).maybeSingle();
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
 */ function redirectPreservingCookies(request, response, pathname) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const redirect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    for (const cookie of response.cookies.getAll()){
        redirect.cookies.set(cookie);
    }
    return redirect;
}
const config = {
    matcher: [
        // Everything except Next internals and static assets.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f2b15f93._.js.map
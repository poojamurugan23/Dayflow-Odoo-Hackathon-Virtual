import { KeyRound, ShieldCheck } from "lucide-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { FieldRow } from "@/components/profile/field-row";

/**
 * Security tab — the fourth tab on one's own profile (wireframe image 3).
 *
 * Rendered ONLY for the owner. An admin looking at someone else's profile does
 * not get it: an admin has no business setting another person's password from a
 * profile screen, and offering the control would imply they can. Password
 * resets for other people are a separate flow (HR reissues a temporary password
 * by re-creating the account), out of scope here.
 *
 * The form is the same component the forced-change screen uses, driving the same
 * server action and the same validator — so the rules a user sees on this tab
 * are literally the rules enforced on submit.
 */
export function SecurityTab({
  loginId,
  email,
  lastSignInAt,
  profileId,
}: {
  loginId: string;
  email: string;
  /** From the auth session, so no extra query. Null if the provider omits it. */
  lastSignInAt: string | null;
  profileId: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          <KeyRound className="size-3" aria-hidden />
          Change password
        </h3>

        <div className="max-w-sm rounded-xl border border-border bg-card p-5">
          <ChangePasswordForm
            requireCurrent
            // Stay on the profile rather than being thrown to the dashboard.
            redirectTo={`/employees/${profileId}`}
            submitLabel="Update password"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
          <ShieldCheck className="size-3" aria-hidden />
          Sign-in details
        </h3>

        <dl className="divide-y divide-border">
          <FieldRow label="Login ID" value={loginId} mono />
          <FieldRow label="Email" value={email} />
          <FieldRow label="Last signed in" value={formatSignIn(lastSignInAt)} />
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">
          You can sign in with either your login ID or your email address.
        </p>
      </section>
    </div>
  );
}

/** "22 Aug 2026, 14:32" in IST — the timezone every other time in the app uses. */
function formatSignIn(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

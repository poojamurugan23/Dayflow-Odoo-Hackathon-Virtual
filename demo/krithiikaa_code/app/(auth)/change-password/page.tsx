import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata: Metadata = { title: "Change your password · Dayflow" };

/**
 * Reached only when the signed-in user has must_change_password = true.
 * Middleware pins them here until it is cleared — every other route redirects
 * back to this page, so a temporary password cannot be left in place.
 */
export default function ChangePasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
          Change your password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You signed in with a temporary password. Choose your own before continuing.
        </p>
      </div>

      <ChangePasswordForm />
    </>
  );
}

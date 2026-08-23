"use client";

import { useActionState, useState } from "react";

import { changePassword } from "@/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordRules } from "@/components/auth/password-rules";
import { SubmitButton } from "@/components/auth/submit-button";

/**
 * The one password-change form, used by both the forced-change screen (Phase 1)
 * and the Security tab (Phase 6).
 *
 * `requireCurrent` is what separates them. On the forced-change screen the user
 * authenticated with the temporary password moments ago, so asking for it again
 * is friction; from inside a live session it is the check that stops someone
 * changing the password on a borrowed laptop.
 */
export function ChangePasswordForm({
  requireCurrent = false,
  redirectTo,
  submitLabel = "Set New Password",
}: {
  requireCurrent?: boolean;
  /** Where to land afterwards. Defaults to the dashboard, as in Phase 1. */
  redirectTo?: string;
  submitLabel?: string;
} = {}) {
  const [state, formAction] = useActionState(changePassword, EMPTY_FORM_STATE);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {requireCurrent && (
        <PasswordField
          name="currentPassword"
          label="Current Password"
          autoComplete="current-password"
        />
      )}

      <PasswordField
        name="password"
        label="New Password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        describedBy="change-password-rules"
      />

      <PasswordRules value={password} id="change-password-rules" />

      <PasswordField name="confirmPassword" label="Confirm New Password" autoComplete="new-password" />

      <FormError message={state.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";

import { changePassword } from "@/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordRules } from "@/components/auth/password-rules";
import { SubmitButton } from "@/components/auth/submit-button";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, EMPTY_FORM_STATE);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
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

      <SubmitButton>Set New Password</SubmitButton>
    </form>
  );
}

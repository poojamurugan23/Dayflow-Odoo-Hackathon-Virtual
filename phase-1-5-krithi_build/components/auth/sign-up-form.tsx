"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signUpCompany } from "@/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordRules } from "@/components/auth/password-rules";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpCompany, EMPTY_FORM_STATE);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="companyName">Company Name</Label>
        <Input id="companyName" name="companyName" required autoFocus placeholder="Odoo India" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="logo">Company Logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" className="cursor-pointer" />
        <p className="text-xs text-muted-foreground">
          Optional. File uploads land in a later phase — a placeholder logo is used for now.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="adminName">Your Name</Label>
        <Input id="adminName" name="adminName" required placeholder="Priya Sharma" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98450 11234" />
        </div>
      </div>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        describedBy="signup-password-rules"
      />

      <PasswordRules value={password} id="signup-password-rules" />

      <PasswordField name="confirmPassword" label="Confirm Password" autoComplete="new-password" />

      <FormError message={state.error} />

      <SubmitButton>Sign Up</SubmitButton>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}

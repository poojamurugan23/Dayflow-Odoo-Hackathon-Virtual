"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn } from "@/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { FormError } from "@/components/auth/form-error";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const [state, formAction] = useActionState(signIn, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="identifier">Login ID or Email</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="OIPRSH20210001"
          required
          autoFocus
          // A login ID is a code, so it gets the mono face like every other
          // identifier in the product. An email typed here is still legible.
          className="font-mono"
        />
      </div>

      <PasswordField name="password" label="Password" autoComplete="current-password" />

      <FormError message={state.error} />

      <SubmitButton>Sign In</SubmitButton>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign Up
        </Link>
      </p>
    </form>
  );
}

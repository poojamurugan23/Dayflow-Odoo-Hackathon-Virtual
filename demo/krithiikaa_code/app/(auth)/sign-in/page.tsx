import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign In · Dayflow" };

export default function SignInPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-card-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the login ID your HR team gave you, or your work email.
        </p>
      </div>

      <SignInForm />
    </>
  );
}

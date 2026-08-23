import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Register your company · Dayflow" };

export default function SignUpPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
          Register your company
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This creates your organization and its first admin account.
        </p>
      </div>

      <SignUpForm />

      <div className="mt-6 rounded-md border border-border bg-muted/40 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Employees cannot sign up here.</span> HR
          creates each employee, and the system generates their login ID — company initials, initials
          of their name, joining year, and a serial, like{" "}
          <code className="font-mono text-[11px] text-foreground">OIPRSH20210001</code> — plus a
          one-time password they change on first sign in.
        </p>
      </div>
    </>
  );
}

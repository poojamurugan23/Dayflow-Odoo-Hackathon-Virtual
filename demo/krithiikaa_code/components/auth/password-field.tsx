"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  name: string;
  label: string;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
  describedBy?: string;
};

/** Password input with a reveal toggle. */
export function PasswordField({
  name,
  label,
  autoComplete = "current-password",
  value,
  onChange,
  describedBy,
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const id = useId();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={revealed ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="pr-10"
          aria-describedby={describedBy}
          {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
          tabIndex={-1}
        >
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

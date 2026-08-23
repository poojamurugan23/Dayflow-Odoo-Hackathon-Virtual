"use client";

import { Check, X } from "lucide-react";

import { PASSWORD_RULES, passwordScore } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * Live rules indicator. Reads PASSWORD_RULES — the same array the server
 * validator uses — so what the user is told is what actually gets enforced.
 */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  const score = passwordScore(value);
  const total = PASSWORD_RULES.length;

  return (
    <div id={id} className="space-y-2">
      <div className="flex gap-1" aria-hidden>
        {PASSWORD_RULES.map((rule, index) => (
          <span
            key={rule.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? strengthColor(score) : "bg-border",
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Password meets {score} of {total} requirements.
      </p>

      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                met ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {met ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <X className="size-3.5 shrink-0 opacity-40" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function strengthColor(score: number): string {
  if (score <= 1) return "bg-destructive";
  if (score < PASSWORD_RULES.length) return "bg-amber-500";
  return "bg-emerald-500";
}

"use client";

import { useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";

import { regularizePunch } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Innovation 1 — regularization.
 *
 * A forgotten check-out reads as a near-zero-hours day, which the derivation
 * scores as a half day and quietly costs payable days. This lets the person
 * state when they actually left. The punch is marked is_regularized so the
 * correction is never mistaken for a real punch.
 */
export function RegularizeForm({ punchId, day }: { punchId: string; day: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => setOpen(true)}
        aria-label={`Regularize ${day}`}
      >
        Regularize
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-1.5"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await regularizePunch(formData);
          if (result.error) setError(result.error);
          else setOpen(false);
        });
      }}
    >
      <input type="hidden" name="punchId" value={punchId} />
      <Input
        name="checkOutTime"
        type="time"
        required
        defaultValue="18:00"
        aria-label="Actual check-out time"
        className="h-7 w-[7.5rem] font-mono text-xs"
      />
      <Button type="submit" size="xs" disabled={pending}>
        Save
      </Button>
      <Button type="button" size="xs" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && (
        <span role="alert" className="flex items-center gap-1 text-[11px] text-destructive">
          <TriangleAlert className="size-3" aria-hidden />
          {error}
        </span>
      )}
    </form>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Prev / next stepper plus a native picker, driven entirely by the URL so the
 * tables stay server components. `mode` decides whether we step by month
 * (employee view) or by day (admin view).
 */
export function PeriodStepper({
  mode,
  value,
  label,
  prev,
  next,
}: {
  mode: "month" | "day";
  /** YYYY-MM-DD for day mode, YYYY-MM for month mode. */
  value: string;
  label: string;
  prev: string;
  next: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(to: string) {
    const query = new URLSearchParams(params.toString());
    query.set(mode, to);
    router.push(`/attendance?${query.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => go(prev)}>
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => go(next)}>
        <ChevronRight className="size-4" aria-hidden />
      </Button>

      <input
        type={mode === "day" ? "date" : "month"}
        value={value}
        onChange={(event) => {
          if (event.target.value) go(mode === "day" ? event.target.value : `${event.target.value}-01`);
        }}
        aria-label={mode === "day" ? "Pick a date" : "Pick a month"}
        className="h-7 rounded-md border border-border bg-transparent px-2 font-mono text-xs text-foreground"
      />

      {/* The native month/date input already spells out the period, so the
          heading is redundant on a narrow screen — two "August 2026" side by
          side. Kept from sm up, where there is room and it reads as a heading. */}
      <h2 className="hidden text-sm font-medium text-foreground sm:block">{label}</h2>
    </div>
  );
}

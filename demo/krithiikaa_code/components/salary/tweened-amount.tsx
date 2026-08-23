"use client";

import { useEffect, useRef, useState } from "react";

import { formatINR } from "@/lib/salary";

/**
 * A rupee figure that counts to its new value instead of snapping.
 *
 * Why bother: when an admin types a new wage, six amounts and four deductions
 * all change at once. Snapping makes it look like the page reloaded; tweening
 * makes it read as one recomputation, which is what actually happened.
 *
 * Two constraints make it safe rather than decorative:
 *   - `tabular-nums` and a fixed-width container, so digits never reflow mid-
 *     tween and the column stays aligned.
 *   - `prefers-reduced-motion` skips straight to the value. Animated numbers are
 *     exactly the kind of motion that setting exists for.
 */
const DURATION_MS = 260;

export function TweenedAmount({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || fromRef.current === value) {
      fromRef.current = value;
      setShown(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      // easeOutCubic: fast to begin, settling at the end, so the final figure
      // feels arrived-at rather than cut off.
      const eased = 1 - (1 - t) ** 3;
      setShown(from + (value - from) * eased);

      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else {
        fromRef.current = value;
        setShown(value);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Land on the target if interrupted, so a fast typist never leaves a
      // half-tweened number on screen.
      fromRef.current = value;
    };
  }, [value]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatINR(shown)}
    </span>
  );
}

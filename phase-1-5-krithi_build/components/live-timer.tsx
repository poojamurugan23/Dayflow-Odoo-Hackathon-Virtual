"use client";

import { useEffect, useState } from "react";

/**
 * Counts up from `since`, ticking once a second.
 *
 * Rendered in the mono face with tabular-nums so every digit occupies the same
 * width — otherwise the pill visibly twitches each second as glyphs change.
 */
export function LiveTimer({ since, className }: { since: string; className?: string }) {
  const [elapsed, setElapsed] = useState(() => elapsedFrom(since));

  useEffect(() => {
    setElapsed(elapsedFrom(since));
    const id = setInterval(() => setElapsed(elapsedFrom(since)), 1000);
    return () => clearInterval(id);
  }, [since]);

  return (
    <time
      dateTime={since}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={`Session running for ${elapsed}`}
      // The initial value is derived from "now", so the server string and the
      // hydration string are always a second or two apart. Without this React
      // calls that a mismatch and regenerates the tree — which remounts this
      // component and resets the timer to 00:00:00, over and over. This is the
      // documented escape hatch for exactly this case: a rendered timestamp.
      suppressHydrationWarning
    >
      {elapsed}
    </time>
  );
}

function elapsedFrom(since: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Current wall-clock time in IST.
 *
 * Renders nothing until after mount, deliberately. Printing `new Date()` during
 * SSR and again on the client produces two different strings, which React
 * reports as a hydration mismatch and then re-renders the whole tree to fix.
 * Waiting for the effect also means the clock stays current instead of frozen
 * at whatever second the page was rendered.
 */
export function ClockIST({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {now}
    </span>
  );
}

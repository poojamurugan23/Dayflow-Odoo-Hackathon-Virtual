"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { LogIn, LogOut, TriangleAlert } from "lucide-react";

import { checkIn, checkOut } from "@/actions/attendance";
import { ClockIST, LiveTimer } from "@/components/live-timer";

/*
 * Magenta appears here and nowhere else: --status-live, as `bg-status-live`.
 * A forgotten check-out uses --status-absent, the same amber the attendance
 * tables use for the same fact.
 */

type Session = {
  active: boolean;
  since: string | null;
  /** An open punch left over from an earlier day — a forgotten check-out, not
   *  a live session. Blocks a new check-in until it is regularized. */
  staleSince: string | null;
};

/**
 * Check in / check out, visible on every screen.
 *
 * useOptimistic flips the pill the instant it is clicked, before the action
 * resolves — checking in is the most-repeated interaction in the app and a
 * spinner where the timer belongs makes it feel broken. If the write fails,
 * React discards the optimistic value and the pill snaps back, so the failure
 * is also surfaced in words rather than leaving the revert unexplained.
 */
export function SystrayCheckIn({ serverSession }: { serverSession: Session }) {
  const [session, setSession] = useOptimistic(serverSession, (_current, next: Session) => next);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      if (session.active) {
        setSession({ ...session, active: false, since: null });
        const result = await checkOut();
        if (result.error) setError(result.error);
      } else {
        // No server punch_in yet, so the timer starts from the click. The next
        // render replaces this with the real punch_in.
        setSession({ ...session, active: true, since: new Date().toISOString() });
        const result = await checkIn();
        if (result.error) setError(result.error);
      }
    });
  }

  // A punch left open from an earlier day has to be resolved before a new
  // session can start, so say so and point at the fix rather than letting the
  // check-in button fail silently every time it is pressed.
  if (!session.active && session.staleSince) {
    return (
      <Link
        href="/attendance"
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-dashed border-status-absent px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-status-absent/10"
        title={`Open session from ${dateIST(session.staleSince)} — regularize it to check in again`}
      >
        <TriangleAlert className="size-3.5 shrink-0 text-status-absent" aria-hidden />
        <span className="whitespace-nowrap text-status-absent">
          Check-out missing
        </span>
        <span className="hidden whitespace-nowrap text-muted-foreground sm:inline">
          {dateIST(session.staleSince)}
        </span>
      </Link>
    );
  }

  if (session.active && session.since) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label="Check out"
          className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs transition-colors duration-150 hover:border-muted-foreground/40 disabled:opacity-70"
        >
          {/* The live dot. The only magenta on screen. */}
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-status-live motion-safe:animate-pulse"
          />
          <span className="hidden whitespace-nowrap text-muted-foreground lg:inline">
            Since {timeIST(session.since)}
          </span>
          <LiveTimer since={session.since} className="font-mono text-foreground" />
          <LogOut className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
        {error && <SystrayError message={error} />}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label="Check in"
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors duration-150 hover:border-muted-foreground/40 disabled:opacity-70"
      >
        <LogIn className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="whitespace-nowrap">Check in</span>
        <ClockIST className="hidden font-mono text-muted-foreground lg:inline" />
      </button>
      {error && <SystrayError message={error} />}
    </div>
  );
}

function SystrayError({ message }: { message: string }) {
  return (
    <span role="alert" className="hidden max-w-[14rem] truncate text-[11px] text-destructive md:inline">
      {message}
    </span>
  );
}

function timeIST(value: string): string {
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function dateIST(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
}

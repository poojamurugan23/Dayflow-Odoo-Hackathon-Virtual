"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so Dayflow can be added to a phone's home screen
 * and open full-screen.
 *
 * Registered after mount rather than in the document head: registration is not
 * needed to paint the first screen, and doing it during hydration competes with
 * the fonts and the first data fetch for bandwidth on a phone.
 *
 * Skipped in development — a cached shell served by a stale worker is a
 * genuinely confusing thing to debug against a hot-reloading dev server.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nice-to-have; a registration failure must never
        // surface to someone trying to check in.
      });
    };

    // Wait for the page to settle so registration never delays first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

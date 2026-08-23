import Link from "next/link";

/**
 * Shell for the unauthenticated pages. Keeps the graph-paper canvas from the
 * landing page so sign-in feels like the same product.
 *
 * Structure is token-driven (bg-background, border-border, bg-card), so the
 * Muster palette in Phase 6 is a variable change rather than a rewrite.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-foreground">
            Dayflow
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Every workday, perfectly aligned.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}

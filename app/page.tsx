/**
 * Phase 0 placeholder.
 *
 * Exists only so the first Vercel deploy has something to render. Phase 1
 * replaces this with a redirect to /sign-in for guests and /employees for a
 * signed-in user.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6">
      {/* "ink on graph paper" — a nod to the Muster direction, restyled in Phase 6 */}
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

      <section className="relative w-full max-w-md rounded-lg border border-border bg-card p-10 text-center shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Odoo Hackathon
        </p>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-card-foreground">Dayflow</h1>

        <p className="mt-3 text-sm text-muted-foreground">Every workday, perfectly aligned.</p>

        <hr className="my-8 border-border" />

        <p className="text-sm text-muted-foreground">
          Human Resource Management System
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Phase 0 · foundation deployed
        </p>
      </section>
    </main>
  );
}

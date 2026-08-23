import { Lockup } from "@/components/brand/lockup";

/**
 * Brand surface — brand guidelines Part 8.
 *
 * These three screens (sign in, sign up, forced password change) are the ONLY
 * place the Violet Dusk gradient is allowed. Everything behind the login is a
 * working surface: Paper canvas, white cards, no gradient. The split is what
 * keeps the gradient meaning "this is Dayflow" rather than becoming decoration
 * that shows up behind a salary table.
 *
 * The card itself stays Paper rather than white, so the form reads as a sheet
 * laid on the brand rather than a hole cut in it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="brand-gradient relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* A soft plum vignette so the Cream corner does not fight the card for
          attention. Decorative only — no content depends on it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, color-mix(in srgb, var(--plum) 45%, transparent), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <Lockup orgName="Odoo India" tone="paper" size="lg" />
          <p className="mt-3 text-sm text-paper/75">Every workday, perfectly aligned.</p>
        </div>

        <div className="rounded-2xl bg-paper p-6 shadow-[0_20px_50px_-20px_rgba(36,24,38,0.55)] ring-1 ring-plum/10 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

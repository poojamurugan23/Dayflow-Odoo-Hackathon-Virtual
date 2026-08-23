/**
 * The odoo wordmark, inline.
 *
 * Inline SVG rather than <Image src="/odoo-logo.svg">: it is small, it needs to
 * recolour with the surface it sits on (the neutral letters go Paper on the plum
 * panel and grey on a working surface), and inlining removes a request from the
 * critical path of the sign-in screen.
 *
 * `tone`:
 *   "brand" — mauve leading "o", grey remainder. Use on white or Paper.
 *   "paper" — mauve leading "o", Paper remainder. Use on the plum panel.
 */
export function OdooLogo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "paper";
}) {
  const neutral = tone === "paper" ? "var(--paper)" : "#888888";

  return (
    <svg
      viewBox="0 0 560 150"
      className={className}
      role="img"
      aria-label="odoo"
      focusable="false"
    >
      <g fill="none" strokeWidth={26} strokeLinecap="round">
        {/* The one coloured letter — brand mauve, per the wordmark. */}
        <circle cx={66} cy={94} r={40} stroke="var(--mauve)" />
        <circle cx={208} cy={94} r={40} stroke={neutral} />
        <path d="M248 94 V 20" stroke={neutral} />
        <circle cx={350} cy={94} r={40} stroke={neutral} />
        <circle cx={492} cy={94} r={40} stroke={neutral} />
      </g>
    </svg>
  );
}

/**
 * The square mark, for tight spots and the app icon: just the ring, in plum.
 * Matches the installed-app icon so the tab, the home screen and the nav all
 * carry the same shape.
 */
export function OdooMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Dayflow" focusable="false">
      <circle cx={50} cy={50} r={31} fill="none" stroke="var(--plum)" strokeWidth={19} />
    </svg>
  );
}

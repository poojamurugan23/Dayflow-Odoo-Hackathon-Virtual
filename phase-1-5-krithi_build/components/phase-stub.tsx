import { getCurrentUser } from "@/lib/auth";
import { roleLabel } from "@/lib/display";

/**
 * Placeholder for a screen a later phase builds.
 *
 * It prints the signed-in user's name and role, which is what makes the auth
 * and role plumbing observable at the Phase 1 checkpoint. Each of these is
 * replaced wholesale by its real screen later.
 */
export async function PhaseStub({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <span className="rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {phase}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <dl className="mt-8 grid max-w-md gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
        <Row label="Signed in as" value={user.fullName} />
        <Row label="Role" value={roleLabel(user.role)} />
        <Row label="Login ID" value={user.loginId} mono />
        <Row label="Email" value={user.email} />
        <Row label="Company" value={user.organization?.name ?? "—"} />
      </dl>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-card px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

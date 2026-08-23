/**
 * Inline error, rendered next to the form (SRS 3.1.2: "Incorrect credentials
 * should display error messages"). Deliberately not a toast or an alert —
 * those disappear and cannot be re-read.
 *
 * role="alert" so screen readers announce it when it appears.
 */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

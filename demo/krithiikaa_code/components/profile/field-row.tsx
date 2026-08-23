import { cn } from "@/lib/utils";

/** Read-only label/value pair. `—` for empty so rows never collapse. */
export function FieldRow({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  hint?: string;
}) {
  const empty = value === null || value === undefined || value === "";

  return (
    <div className="grid grid-cols-[minmax(7rem,9rem)_1fr] items-baseline gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-sm",
          empty ? "text-muted-foreground/50" : "text-foreground",
          mono && !empty && "font-mono text-[13px]",
        )}
      >
        {empty ? "—" : value}
        {hint && <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}

/** Placeholder for a section with nothing in it yet. */
export function SectionEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

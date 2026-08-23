import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One empty state, used by every list in the app.
 *
 * It exists because five hand-rolled empty states had drifted into five
 * different voices — one apologising, one blank, one saying "Nothing to show
 * here yet", which is placeholder copy wearing a shirt. The product voice is
 * sentence case, verb-first, and points at the next action: "No employees yet —
 * add your first employee", not "There are no records to display."
 *
 * The icon sits in a Cream disc so an empty screen still looks like Dayflow
 * rather than looking broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-cream/60 text-plum"
      >
        <Icon className="size-5" />
      </span>

      <h2 className="mt-4 text-sm font-medium text-foreground">{title}</h2>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}

      {action && (
        <Button asChild className="mt-5" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

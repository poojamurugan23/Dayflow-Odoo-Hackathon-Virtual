"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  /** Only rendered for admin/HR. Nothing needs it yet; later phases will. */
  managerOnly?: boolean;
};

/**
 * Top-bar navigation.
 *
 * The active item gets full-strength ink and a Plum underline — brand
 * guidelines Part 8. Inactive items sit at ink-2 and come up to ink on hover,
 * so the current location is legible without colour alone carrying it (the
 * underline does that too).
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-2 text-sm transition-colors duration-150",
              active
                ? "font-medium text-ink"
                : "text-ink-2 hover:bg-muted/60 hover:text-ink",
            )}
          >
            {item.label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-plum"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

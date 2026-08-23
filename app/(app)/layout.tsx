import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser, initials, roleLabel } from "@/lib/auth";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { SystrayCheckIn } from "@/components/systray-checkin";
import { UserMenu } from "@/components/user-menu";

/**
 * Shell for every authenticated page: one top bar, no sidebar.
 *
 * The role is read ONCE here and passed down, so a page render never re-queries
 * it. `managerOnly` items are filtered out for employees — nothing needs it
 * yet, but Phase 2's admin-only affordances slot straight into the array.
 */
const NAV_ITEMS: NavItem[] = [
  { href: "/employees", label: "Employees" },
  { href: "/attendance", label: "Attendance" },
  { href: "/time-off", label: "Time Off" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already guards these routes; this is defence in depth for the
  // case where a session dies between the middleware check and the render.
  if (!user) redirect("/sign-in");

  const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly || user.isManager);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/employees" className="flex shrink-0 items-center gap-2">
            {user.organization?.logoUrl ? (
              <Image
                src={user.organization.logoUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 rounded"
                unoptimized
              />
            ) : (
              <span className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
                {user.organization?.code ?? "DF"}
              </span>
            )}
            <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline">
              {user.organization?.name ?? "Dayflow"}
            </span>
          </Link>

          <div className="hidden sm:block">
            <NavLinks items={visibleItems} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <SystrayCheckIn />
            {user.isManager && (
              <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
                {roleLabel(user.role)}
              </span>
            )}
            <UserMenu
              fullName={user.fullName}
              loginId={user.loginId}
              roleLabel={roleLabel(user.role)}
              avatarUrl={user.avatarUrl}
              initials={initials(user.fullName)}
            />
          </div>
        </div>

        {/* Nav wraps below the bar on small screens rather than collapsing into
            a menu — a full mobile pass is Phase 6. */}
        <div className="border-t border-border px-4 pb-1 sm:hidden">
          <NavLinks items={visibleItems} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

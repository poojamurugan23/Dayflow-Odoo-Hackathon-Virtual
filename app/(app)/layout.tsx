import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser } from "@/lib/auth";
import { getOpenPunch } from "@/lib/attendance";
import { initials, roleLabel } from "@/lib/display";
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

  // The systray needs the live session, so the layout resolves it once here
  // rather than every page doing its own lookup.
  const openPunch = await getOpenPunch(user.id);
  const session = {
    // An open punch from an earlier day is a forgotten check-out, not a running
    // session, so it must not start a timer counting from yesterday — and it
    // blocks a new check-in, so the systray surfaces it instead of failing.
    active: Boolean(openPunch?.isToday),
    since: openPunch?.isToday ? openPunch.punchIn : null,
    staleSince: openPunch && !openPunch.isToday ? openPunch.punchIn : null,
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* min-w-0 on every flex child, and the label text hidden at narrow
            widths — without both, the systray pushed the row wider than the
            viewport and the page scrolled sideways. */}
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <Link href="/employees" className="flex min-w-0 shrink-0 items-center gap-2">
            {user.organization?.logoUrl ? (
              <Image
                src={user.organization.logoUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 rounded"
                unoptimized
              />
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
                {user.organization?.code ?? "DF"}
              </span>
            )}
            <span className="hidden truncate text-sm font-semibold tracking-tight text-foreground lg:inline">
              {user.organization?.name ?? "Dayflow"}
            </span>
          </Link>

          <div className="hidden min-w-0 sm:block">
            <NavLinks items={visibleItems} />
          </div>

          <div className="ml-auto flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <SystrayCheckIn serverSession={session} />
            {user.isManager && (
              <span className="hidden shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground lg:inline">
                {roleLabel(user.role)}
              </span>
            )}
            <div className="shrink-0">
              <UserMenu
                fullName={user.fullName}
                loginId={user.loginId}
                roleLabel={roleLabel(user.role)}
                avatarUrl={user.avatarUrl}
                initials={initials(user.fullName)}
              />
            </div>
          </div>
        </div>

        {/* Nav wraps below the bar on small screens rather than collapsing into
            a menu — a full mobile pass is Phase 6. */}
        <div className="overflow-x-auto border-t border-border px-4 pb-1 sm:hidden">
          <NavLinks items={visibleItems} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

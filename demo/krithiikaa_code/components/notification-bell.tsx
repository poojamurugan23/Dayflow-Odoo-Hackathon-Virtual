"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";

import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type BellNotification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  /** Pre-formatted on the server, so Intl.RelativeTimeFormat stays out of the bundle. */
  when: string;
};

/* The count badge uses the danger token: magenta is reserved for a live
   session and must stay the only magenta on screen. */

/**
 * In-app notification centre — the agreed replacement for email.
 *
 * Refreshes on navigation rather than subscribing to realtime. Every mutation
 * that creates a notification calls revalidatePath("/", "layout"), so the bell
 * is already correct by the time the next render lands. A websocket would add a
 * connection to keep alive for a fraction of a second's improvement.
 */
export function NotificationBell({ notifications }: { notifications: BellNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Optimistic so the badge drops the instant something is clicked. Reading a
  // notification is an acknowledgement, and acknowledgement that lags feels
  // like the click was missed.
  const [items, markRead] = useOptimistic(notifications, (current, id: string | "all") =>
    current.map((item) => (id === "all" || item.id === id ? { ...item, isRead: true } : item)),
  );

  const unread = items.filter((item) => !item.isRead).length;

  function openNotification(notification: BellNotification) {
    setOpen(false);
    startTransition(async () => {
      if (!notification.isRead) {
        markRead(notification.id);
        await markNotificationRead(notification.id);
      }
      if (notification.link) router.push(notification.link);
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          {unread > 0 && (
            <span
              // aria-hidden: the count is already in the button's label, so a
              // screen reader would otherwise announce the number twice.
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-semibold leading-4 text-paper ring-2 ring-background"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-medium text-foreground">Notifications</span>
          {unread > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                markRead("all");
                startTransition(async () => {
                  await markAllNotificationsRead();
                });
              }}
            >
              Mark all read
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <BellOff className="mx-auto size-4 text-muted-foreground/60" aria-hidden />
            <p className="mt-2 text-xs text-muted-foreground">
              Nothing yet — leave decisions and new requests land here.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((notification) => (
              <li key={notification.id} className="border-b border-border last:border-0">
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                    !notification.isRead && "bg-muted/30",
                  )}
                >
                  {/* Unread marker. Read rows keep the same 1.5 spacer so the
                      titles stay aligned down the list. */}
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      !notification.isRead && "bg-status-danger",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-xs",
                        notification.isRead
                          ? "text-muted-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {notification.title}
                    </span>
                    {notification.body && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {notification.body}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
                      {notification.when}
                    </span>
                  </span>
                  {!notification.isRead && <span className="sr-only">unread</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-3 py-2">
          <Link
            href="/time-off"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Go to Time Off
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

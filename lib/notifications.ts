import { createClient } from "@/lib/supabase/server";

/**
 * In-app notification centre — the agreed replacement for email.
 *
 * There is no SMTP in this build, so "HR has been notified" had to become
 * something a person can actually see. Reads use the caller's own client: the
 * RLS policy from 0005 is `profile_id = auth.uid()`, so there is no way to read
 * someone else's inbox even with a crafted profile id.
 *
 * Writes are NOT here. Inserting a notification needs the service role (0005
 * revokes INSERT from `authenticated`), and every insert belongs next to the
 * event that caused it — see actions/leave.ts.
 */

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

/** The bell's dropdown. Newest first, capped — the bell is a glance, not an archive. */
export async function listNotifications(limit = 12): Promise<Notification[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as {
    id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  return count ?? 0;
}

/** "3 minutes ago". Rendered on the server so the client gets a plain string. */
export function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [3600, "hour"],
    [86_400, "day"],
    [604_800, "week"],
  ];

  let divisor = 60;
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  for (const [size, name] of units) {
    if (seconds >= size) {
      divisor = size;
      unit = name;
    }
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    -Math.round(seconds / divisor),
    unit,
  );
}

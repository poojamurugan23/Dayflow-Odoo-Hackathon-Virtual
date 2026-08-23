"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Notification mutations. The only write a user makes to their own inbox is
 * flipping is_read.
 *
 * These use the caller's own client on purpose. 0005's policy pins the row to
 * `profile_id = auth.uid()` and the column grant allows only `is_read`, so
 * Postgres refuses a read-receipt on someone else's notification and refuses a
 * rewrite of the title — even if the id below came from a crafted request.
 * There is nothing left for this code to check, which is the point.
 */

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired." };
  if (!id) return { error: "Missing notification." };

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  if (error) return { error: "Could not mark that as read." };

  revalidatePath("/", "layout");
  return { error: null };
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired." };

  const supabase = await createClient();
  // No profile filter needed — RLS scopes this to the caller's own rows, so
  // adding one would be belt-and-braces rather than protection.
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) return { error: "Could not mark those as read." };

  revalidatePath("/", "layout");
  return { error: null };
}

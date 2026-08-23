import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

/**
 * "My Profile" from the avatar menu.
 *
 * This redirects to the employee profile route rather than rendering its own
 * copy. The profile shell already resolves `isSelf` and `isAdmin` and decides
 * which tabs a viewer gets, so a second implementation would be a second place
 * for those rules to be got wrong — and Phase 5 adds salary to exactly those
 * rules. One route, one permission boundary.
 *
 * The Phase 2 stub that used to live here was never replaced, so until now the
 * avatar menu's "My Profile" led to a placeholder.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  redirect(`/employees/${user.id}`);
}

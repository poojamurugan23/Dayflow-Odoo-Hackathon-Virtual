import type { Metadata } from "next";

import { PhaseStub } from "@/components/phase-stub";

export const metadata: Metadata = { title: "My Profile · Dayflow" };

/**
 * Stub so the avatar dropdown's "My Profile" item is not a dead link.
 * Phase 2 builds the real profile with the Resume and Private Info tabs.
 */
export default function ProfilePage() {
  return (
    <PhaseStub
      title="My Profile"
      description="Resume, Private Info, and the read-only field rules arrive in Phase 2."
      phase="Phase 2"
    />
  );
}

import type { Metadata } from "next";

import { PhaseStub } from "@/components/phase-stub";

export const metadata: Metadata = { title: "Time Off · Dayflow" };

export default function TimeOffPage() {
  return (
    <PhaseStub
      title="Time Off"
      description="Balance chips, the request modal, and the approval queue arrive in Phase 4."
      phase="Phase 4"
    />
  );
}

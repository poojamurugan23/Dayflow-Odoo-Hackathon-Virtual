import type { Metadata } from "next";

import { PhaseStub } from "@/components/phase-stub";

export const metadata: Metadata = { title: "Attendance · Dayflow" };

export default function AttendancePage() {
  return (
    <PhaseStub
      title="Attendance"
      description="Check in/out, the day view for HR, and the month view for employees arrive in Phase 3."
      phase="Phase 3"
    />
  );
}

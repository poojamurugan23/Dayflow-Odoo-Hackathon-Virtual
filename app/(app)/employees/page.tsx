import type { Metadata } from "next";

import { PhaseStub } from "@/components/phase-stub";

export const metadata: Metadata = { title: "Employees · Dayflow" };

/** Dashboard landing for this build. Phase 2 replaces this with the card grid. */
export default function EmployeesPage() {
  return (
    <PhaseStub
      title="Employees"
      description="The employee card grid, search, and NEW button arrive in Phase 2."
      phase="Phase 2"
    />
  );
}

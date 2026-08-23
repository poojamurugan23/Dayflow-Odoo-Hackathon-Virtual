import { Suspense } from "react";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import {
  addDays,
  dayLabel,
  formatHours,
  getDayAttendance,
  getMonthAttendance,
  monthStartOf,
  timeIST,
  todayIST,
} from "@/lib/attendance";
import { AdminDayView, type DayPersonRow } from "@/components/attendance/admin-day-view";
import { EmployeeMonthView } from "@/components/attendance/employee-month-view";
import { AttendanceSkeleton } from "@/components/attendance/attendance-skeleton";

export const metadata: Metadata = { title: "Attendance · Dayflow" };

/**
 * One route, two views, branched by role — per the wireframe: HR sees a whole
 * day across the org, an employee sees their own month.
 *
 * There is no separate admin route. RLS already limits what each caller can
 * read from v_daily_attendance, so a second URL would add a second thing to
 * secure without adding any security.
 */
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; month?: string }>;
}) {
  const params = await searchParams;

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Attendance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Derived from punches, holidays and approved leave. Times shown in IST.
      </p>

      <div className="mt-6">
        <Suspense fallback={<AttendanceSkeleton />}>
          <View day={params.day} month={params.month} />
        </Suspense>
      </div>
    </section>
  );
}

async function View({ day, month }: { day?: string; month?: string }) {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.isManager) {
    const selectedDay = isDate(day) ? day : todayIST();
    const people = await getDayAttendance(selectedDay);

    // Formatting happens here, on the server, so the client component receives
    // plain strings rather than needing the IST helpers in its bundle.
    const rows: DayPersonRow[] = people.map((person) => ({
      profileId: person.profileId,
      fullName: person.fullName,
      jobPosition: person.jobPosition,
      avatarUrl: person.avatarUrl,
      checkIn: timeIST(person.checkIn),
      checkOut: timeIST(person.checkOut),
      workHours: person.workHours > 0 ? formatHours(person.workHours) : null,
      extraHours: person.extraHours > 0 ? formatHours(person.extraHours) : null,
      status: person.status,
      missingCheckout: person.missingCheckout,
      punchId: person.punchId,
      isRegularized: person.isRegularized,
    }));

    return (
      <AdminDayView
        day={selectedDay}
        dayLabel={dayLabel(selectedDay)}
        prevDay={addDays(selectedDay, -1)}
        nextDay={addDays(selectedDay, 1)}
        rows={rows}
      />
    );
  }

  const monthStart = isMonthStart(month) ? month : monthStartOf(todayIST());
  const data = await getMonthAttendance(user.id, monthStart);

  return <EmployeeMonthView data={data} canRegularize />;
}

function isDate(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMonthStart(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

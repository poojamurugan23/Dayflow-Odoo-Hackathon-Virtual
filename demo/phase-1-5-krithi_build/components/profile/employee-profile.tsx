"use client";

import { useCallback, useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { FieldRow } from "@/components/profile/field-row";
import { PrivateInfoTab } from "@/components/profile/private-info-tab";
import { ResumeTab } from "@/components/profile/resume-tab";
import { SecurityTab } from "@/components/profile/security-tab";
import { SalaryTab, type SalaryTabData } from "@/components/salary/salary-tab";
import { StatusBadge } from "@/components/status-dot";
import { formatDate, type DayStatus } from "@/lib/display";
import type { EmployeeDetail, PrivateInfo } from "@/lib/employees";

type Props = {
  employee: EmployeeDetail;
  info: PrivateInfo | null;
  todayStatus: DayStatus | undefined;
  /** Session running right now — shows the live magenta. */
  live: boolean;
  isSelf: boolean;
  isManager: boolean;
  managers: { id: string; label: string }[];
  /**
   * Salary, or null when the caller may not see it. The page only fetches this
   * when the viewer is the owner or an admin, so a non-admin looking at someone
   * else's profile never receives salary data in its payload at all — the tab is
   * not merely hidden, the figures are absent.
   */
  salary: SalaryTabData | null;
  /** Admin: may edit any wage. Narrower than isManager, which includes HR. */
  isAdmin: boolean;
  /** Owner-only sign-in details for the Security tab. */
  security: { loginId: string; email: string; lastSignInAt: string | null } | null;
};

/**
 * Profile shell. Read-only by default (wireframe: "cards open read-only") with
 * an Edit control that appears only for the owner or for HR/admin.
 */
export function EmployeeProfile({
  employee,
  info,
  todayStatus,
  live,
  isSelf,
  isManager,
  managers,
  salary,
  isAdmin,
  security,
}: Props) {
  const [editing, setEditing] = useState(false);
  const stopEditing = useCallback(() => setEditing(false), []);

  const canEdit = isManager || isSelf;
  // Master plan Part 5: Salary Info is admin-only, with the stated exception
  // that an employee may see their OWN, read-only. So the tab appears for an
  // admin on anyone's profile and for anybody on their own — and nowhere else.
  const canSeeSalary = isAdmin || isSelf;
  // Wireframe image 3: the fourth tab, and only on your own profile. An admin
  // viewing someone else does NOT get it — see the note in security-tab.tsx.
  const canSeeSecurity = isSelf && security !== null;
  const canEditAll = isManager;
  // The owner may see their own bank details but not change them; only HR can.
  const bankEditable = isManager;

  return (
    <div>
      <header className="flex flex-wrap items-start gap-5">
        <AvatarUpload
          targetId={employee.id}
          fullName={employee.fullName}
          avatarUrl={employee.avatarUrl}
          editable={canEdit}
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {employee.fullName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{employee.jobPosition ?? "—"}</p>
          <div className="mt-2">
            <StatusBadge status={todayStatus} live={live} />
          </div>
        </div>

        {canEdit && !editing && (
          <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
        )}
      </header>

      {editing ? (
        <div className="mt-8 max-w-3xl rounded-lg border border-border bg-card p-6">
          <EditProfileForm
            employee={employee}
            info={info}
            canEditAll={canEditAll}
            managers={managers}
            onDone={stopEditing}
          />
        </div>
      ) : (
        <>
          {/* Two info columns, per the wireframe. */}
          <div className="mt-6 grid gap-x-10 gap-y-1 border-y border-border py-4 sm:grid-cols-2">
            <dl>
              <FieldRow label="Login ID" value={employee.loginId} mono />
              <FieldRow label="Email" value={employee.email} />
              <FieldRow label="Mobile" value={employee.phone} />
            </dl>
            <dl>
              <FieldRow label="Company" value={employee.companyName} />
              <FieldRow label="Department" value={employee.department} />
              <FieldRow label="Manager" value={employee.managerName} />
              <FieldRow label="Location" value={employee.location} />
            </dl>
          </div>

          <Tabs defaultValue="resume" className="mt-8">
            <TabsList>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="private">Private Info</TabsTrigger>
              {/* Rendered only when the viewer may actually see the figures.
                  Left out entirely rather than disabled: a disabled tab on
                  someone else's profile advertises that there is something
                  there to see. */}
              {canSeeSalary && <TabsTrigger value="salary">Salary Info</TabsTrigger>}
              {canSeeSecurity && <TabsTrigger value="security">Security</TabsTrigger>}
            </TabsList>

            <TabsContent value="resume" className="mt-6">
              <ResumeTab employee={employee} canEdit={canEdit} isSelf={isSelf} />
            </TabsContent>

            <TabsContent value="private" className="mt-6">
              <PrivateInfoTab
                info={info}
                dateOfJoining={employee.dateOfJoining}
                employeeCode={employee.employeeCode}
                canSeeBank={Boolean(info)}
                bankEditable={bankEditable}
              />
            </TabsContent>

            {canSeeSalary && (
              <TabsContent value="salary" className="mt-6">
                <SalaryTab data={salary} canEdit={isAdmin} isSelf={isSelf} />
              </TabsContent>
            )}

            {canSeeSecurity && security && (
              <TabsContent value="security" className="mt-6">
                <SecurityTab
                  loginId={security.loginId}
                  email={security.email}
                  lastSignInAt={security.lastSignInAt}
                  profileId={employee.id}
                />
              </TabsContent>
            )}
          </Tabs>

          <p className="mt-8 text-xs text-muted-foreground">
            Joined {formatDate(employee.dateOfJoining)}
          </p>
        </>
      )}
    </div>
  );
}

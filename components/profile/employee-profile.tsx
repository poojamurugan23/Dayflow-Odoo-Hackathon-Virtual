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
import { StatusBadge } from "@/components/status-dot";
import { formatDate, type DayStatus } from "@/lib/display";
import type { EmployeeDetail, PrivateInfo } from "@/lib/employees";

type Props = {
  employee: EmployeeDetail;
  info: PrivateInfo | null;
  todayStatus: DayStatus | undefined;
  isSelf: boolean;
  isManager: boolean;
  managers: { id: string; label: string }[];
};

/**
 * Profile shell. Read-only by default (wireframe: "cards open read-only") with
 * an Edit control that appears only for the owner or for HR/admin.
 */
export function EmployeeProfile({
  employee,
  info,
  todayStatus,
  isSelf,
  isManager,
  managers,
}: Props) {
  const [editing, setEditing] = useState(false);
  const stopEditing = useCallback(() => setEditing(false), []);

  const canEdit = isManager || isSelf;
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
            <StatusBadge status={todayStatus} />
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
              {/* Visible so the tab bar is complete, but inert until Phase 5.
                  No salary data is sent to the client from this page. */}
              <TabsTrigger value="salary" disabled title="Salary Info arrives in Phase 5">
                Salary Info
              </TabsTrigger>
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
          </Tabs>

          <p className="mt-8 text-xs text-muted-foreground">
            Joined {formatDate(employee.dateOfJoining)}
          </p>
        </>
      )}
    </div>
  );
}

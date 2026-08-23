import { CalendarOff, Users } from "lucide-react";

import { formatDate, initials } from "@/lib/display";
import { formatDays } from "@/lib/leave-days";
import type { LeaveRequestRow } from "@/lib/leave";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttachmentLink } from "@/components/time-off/attachment-link";
import { DecideForm } from "@/components/time-off/decide-form";
import { LeaveStatusPill } from "@/components/time-off/leave-status-pill";

/**
 * One table for both roles. The employee list and the approval queue differ
 * only by a requester column and the decision controls, so they share a
 * component — two near-identical tables is how the two views end up disagreeing
 * about what a status means.
 *
 * `canDecide` hides controls. It is NOT the permission: decideLeave() checks the
 * actor's role and the RLS policy on leave_requests refuses an update from a
 * non-manager and from the requester themselves. This flag only avoids showing
 * a button that would fail.
 */
export function RequestTable({
  requests,
  showRequester = false,
  canDecide = false,
  currentUserId,
  conflicts,
  emptyMessage,
}: {
  requests: LeaveRequestRow[];
  showRequester?: boolean;
  canDecide?: boolean;
  /** Used to suppress decide controls on the approver's own request. */
  currentUserId?: string;
  /** Innovation 2, approver side: teammates already off over each range. */
  conflicts?: Map<string, { count: number; names: string[] }>;
  emptyMessage: string;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <CalendarOff className="mx-auto size-5 text-muted-foreground/60" aria-hidden />
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {showRequester && <Th>Employee</Th>}
            <Th>From</Th>
            <Th>To</Th>
            <Th>Type</Th>
            <Th className="text-right">Days</Th>
            <Th>Status</Th>
            <Th>Reason &amp; decision</Th>
            {canDecide && <Th className="text-right">Action</Th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            // An approver's own request shows in the queue — hiding it would be
            // worse than showing it undecidable — but without controls, because
            // 0005's policy refuses a self-decision at the database.
            const isOwn = currentUserId === request.profileId;
            const conflict = conflicts?.get(request.id);

            return (
              <tr key={request.id} className="border-b border-border last:border-0 align-top">
                {showRequester && (
                  <Td>
                    <span className="flex items-center gap-2">
                      <Avatar className="size-6 shrink-0">
                        {request.avatarUrl && <AvatarImage src={request.avatarUrl} alt="" />}
                        <AvatarFallback className="text-[10px]">
                          {initials(request.requesterName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {request.requesterName}
                        </span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {request.requesterLoginId}
                        </span>
                      </span>
                    </span>
                  </Td>
                )}
                <Td className="font-mono text-xs whitespace-nowrap">{formatDate(request.startDate)}</Td>
                <Td className="font-mono text-xs whitespace-nowrap">{formatDate(request.endDate)}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {request.leaveType}
                  {request.hasAttachment && (
                    <span className="mt-0.5 block">
                      <AttachmentLink requestId={request.id} />
                    </span>
                  )}
                </Td>
                <Td className="text-right font-mono text-xs">{formatDays(request.days)}</Td>
                <Td>
                  <LeaveStatusPill status={request.status} />
                </Td>
                <Td className="max-w-[18rem] text-xs text-muted-foreground">
                  {request.reason && <span className="block">{request.reason}</span>}
                  {request.decisionComment && (
                    <span className="mt-0.5 block text-foreground/80">
                      <span className="text-muted-foreground">
                        {request.decidedByName ?? "System"}:
                      </span>{" "}
                      {request.decisionComment}
                    </span>
                  )}
                  {!request.reason && !request.decisionComment && "—"}

                  {/* Innovation 2 on the approver's side. The employee saw this
                      before submitting; the person deciding needs it more,
                      because staffing is the thing they are actually judging. */}
                  {conflict && conflict.count > 0 && request.status === "pending" && (
                    <span
                      className="mt-1 flex items-start gap-1 text-[11px]"
                      style={{ color: "#B8791C" }}
                    >
                      <Users className="mt-0.5 size-3 shrink-0" aria-hidden />
                      <span>
                        {conflict.count} teammate{conflict.count === 1 ? "" : "s"} already off
                        {conflict.names.length > 0 && `: ${conflict.names.join(", ")}`}
                      </span>
                    </span>
                  )}
                </Td>
                {canDecide && (
                  <Td className="text-right">
                    {request.status !== "pending" ? (
                      <span className="text-xs text-muted-foreground">Decided</span>
                    ) : isOwn ? (
                      <span className="text-xs text-muted-foreground">
                        Your own — needs another approver
                      </span>
                    ) : (
                      <span className="flex justify-end">
                        <DecideForm requestId={request.id} requesterName={request.requesterName} />
                      </span>
                    )}
                  </Td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className ?? ""}`}>{children}</td>;
}

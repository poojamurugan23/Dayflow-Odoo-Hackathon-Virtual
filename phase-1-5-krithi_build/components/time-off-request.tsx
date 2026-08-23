"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CalendarDays, CircleCheck, Paperclip, TriangleAlert, Users } from "lucide-react";

import { checkTeamConflicts, requestLeave } from "@/actions/leave";
import { EMPTY_LEAVE_REQUEST_STATE } from "@/lib/form-state";
import { countLeaveDays, formatDays, type DayCount } from "@/lib/leave-days";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type LeaveTypeChoice = {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  requiresAttachment: boolean;
  /** From v_leave_balance. Null for unpaid, which has no ceiling. */
  available: number | null;
};

/**
 * Apply for leave.
 *
 * The day count and the conflict warning both update as the dates change, so
 * the person sees the cost of the request before they commit to it rather than
 * after HR replies. Both numbers are recomputed server-side on submit — this is
 * the preview, not the decision.
 */
export function TimeOffRequest({
  leaveTypes,
  holidays,
}: {
  leaveTypes: LeaveTypeChoice[];
  /** The org's holiday dates, so the day count can exclude them without a round trip. */
  holidays: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(requestLeave, EMPTY_LEAVE_REQUEST_STATE);

  const [typeId, setTypeId] = useState(leaveTypes[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [conflict, setConflict] = useState<{ count: number; names: string[] } | null>(null);
  const [, startConflictCheck] = useTransition();

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);
  const selectedType = leaveTypes.find((t) => t.id === typeId) ?? null;

  const count: DayCount | null =
    startDate && endDate && endDate >= startDate
      ? countLeaveDays(startDate, endDate, holidaySet)
      : null;

  // The end date follows the start date until it is set independently, because
  // a single-day request is the common case and typing the same date twice is
  // pure friction.
  const endTouched = useRef(false);

  function onStartChange(value: string) {
    setStartDate(value);
    if (!endTouched.current || (endDate && endDate < value)) setEndDate(value);
  }

  // ---- Innovation 2 — team conflict warning ------------------------------
  // Runs when a complete range exists, not on every keystroke. Non-blocking by
  // design: it informs the request and later the approver, it never refuses.
  useEffect(() => {
    if (!startDate || !endDate || endDate < startDate) {
      setConflict(null);
      return;
    }

    let current = true;
    startConflictCheck(async () => {
      const result = await checkTeamConflicts(startDate, endDate);
      // Guards a stale response from overwriting a newer range's answer.
      if (current) setConflict({ count: result.count, names: result.names });
    });
    return () => {
      current = false;
    };
  }, [startDate, endDate]);

  // Close on success and reset, so the next NEW opens a clean form rather than
  // the previous request's dates.
  useEffect(() => {
    if (!state.submitted) return;
    const timer = setTimeout(() => {
      setOpen(false);
      setStartDate("");
      setEndDate("");
      setConflict(null);
      endTouched.current = false;
    }, 1600);
    return () => clearTimeout(timer);
  }, [state.submitted]);

  const needsAttachment = Boolean(selectedType?.requiresAttachment);
  const balanceAfter =
    selectedType?.available !== null && selectedType?.available !== undefined && count
      ? selectedType.available - count.leaveDays
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">NEW</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request time off</DialogTitle>
          <DialogDescription>
            Weekends and public holidays don&apos;t count against your balance.
          </DialogDescription>
        </DialogHeader>

        {state.submitted ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-sm"
          >
            <CircleCheck
              className="mt-0.5 size-4 shrink-0"
              style={{ color: state.autoApproved ? "#1F8A5F" : undefined }}
              aria-hidden
            />
            <div>
              <p className="font-medium text-foreground">
                {state.autoApproved ? "Approved instantly" : "Request submitted"}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {state.autoApproved
                  ? "Sick leave of a day or less within your balance doesn't wait for a queue. Rest up."
                  : "HR has been notified. You'll get a notification when it's decided."}
              </p>
              {state.error && <p className="mt-1 text-destructive">{state.error}</p>}
            </div>
          </div>
        ) : (
          <form action={formAction} className="grid gap-4">
            {/* Radix Select renders a hidden native select for `name`, so the
                value reaches the server action without a shadow input. */}
            <div className="grid gap-1.5">
              <Label htmlFor="leaveType">Leave type</Label>
              <Select name="leaveTypeId" value={typeId} onValueChange={setTypeId} required>
                <SelectTrigger id="leaveType" className="w-full">
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                      {type.available !== null && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatDays(type.available)} left
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && !selectedType.isPaid && (
                <p className="text-xs text-muted-foreground">
                  Unpaid leave has no balance limit, but those days aren&apos;t payable.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="startDate">From</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => onStartChange(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="endDate">To</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(event) => {
                    endTouched.current = true;
                    setEndDate(event.target.value);
                  }}
                />
              </div>
            </div>

            {count && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatDays(count.leaveDays)} day{count.leaveDays === 1 ? "" : "s"} of leave
                </span>
                {count.excluded.length > 0 && (
                  <span className="text-muted-foreground">
                    {count.excluded.length} of {count.calendarDays} skipped (
                    {summariseExcluded(count)})
                  </span>
                )}
                {balanceAfter !== null && (
                  <span className="text-muted-foreground">
                    balance after: {formatDays(Math.max(0, balanceAfter))}
                    {balanceAfter < 0 && (
                      <span className="text-destructive"> — over by {formatDays(-balanceAfter)}</span>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Innovation 2. Amber, not red: this is information, not an error,
                and it never blocks the submit button. */}
            {conflict && conflict.count > 0 && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: "#B8791C55", color: "#B8791C" }}
              >
                <Users className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  <strong className="font-medium">
                    {conflict.count} teammate{conflict.count === 1 ? " is" : "s are"} already off
                  </strong>{" "}
                  {conflict.count === 1 ? "on" : "over"} these dates
                  {conflict.names.length > 0 && ` — ${conflict.names.join(", ")}`}. You can still
                  request it.
                </span>
              </p>
            )}

            {needsAttachment && (
              <div className="grid gap-1.5">
                <Label htmlFor="attachment">
                  Supporting document <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="attachment"
                  name="attachment"
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="file:mr-2 file:text-xs"
                />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="size-3" aria-hidden />
                  For sick leave certificate. PDF, PNG or JPEG, up to 5 MB.
                </p>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="reason">Remarks</Label>
              <Textarea
                id="reason"
                name="reason"
                rows={3}
                placeholder="Anything your approver should know."
              />
            </div>

            {state.error && (
              <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {state.error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Submitting…" : "Submit request"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function summariseExcluded(count: DayCount): string {
  const weekends = count.excluded.filter((e) => e.reason === "weekend").length;
  const holidays = count.excluded.length - weekends;
  const parts: string[] = [];
  if (weekends) parts.push(`${weekends} weekend`);
  if (holidays) parts.push(`${holidays} holiday`);
  return parts.join(", ");
}

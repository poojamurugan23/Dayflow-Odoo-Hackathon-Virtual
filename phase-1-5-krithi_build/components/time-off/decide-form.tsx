"use client";

import { useState, useTransition } from "react";
import { Check, TriangleAlert, X } from "lucide-react";

import { decideLeave } from "@/actions/leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Approve or reject one request, with a comment.
 *
 * The comment field opens on the first click rather than sitting expanded on
 * every pending row — a queue of eight requests with eight open text inputs is
 * unreadable, and a decision deserves the half-second of deliberateness.
 *
 * Approving writes ONLY to leave_requests (status, decided_by, decided_at,
 * decision_comment) and notifications. Attendance is not touched: the view
 * derives `leave` from the approved request on its next read.
 */
export function DecideForm({ requestId, requesterName }: { requestId: string; requesterName: string }) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await decideLeave({ error: null, decided: false }, formData);
      if (result.error) setError(result.error);
      else setDecision(null);
    });
  }

  if (!decision) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="xs"
          onClick={() => setDecision("approved")}
          aria-label={`Approve ${requesterName}'s request`}
        >
          <Check className="size-3" aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => setDecision("rejected")}
          aria-label={`Reject ${requesterName}'s request`}
        >
          <X className="size-3" aria-hidden />
          Reject
        </Button>
        {error && (
          <span role="alert" className="flex items-center gap-1 text-[11px] text-destructive">
            <TriangleAlert className="size-3" aria-hidden />
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <form action={submit} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="decision" value={decision} />
      <Input
        name="comment"
        // Optional per SRS 3.5.2 for an approval; a rejection without a reason
        // is the kind of thing that generates a follow-up conversation anyway,
        // so it is nudged rather than enforced.
        placeholder={decision === "approved" ? "Comment (optional)" : "Why? (recommended)"}
        aria-label={`Comment on ${decision === "approved" ? "approving" : "rejecting"} ${requesterName}'s request`}
        className="h-7 w-48 text-xs"
        autoFocus
      />
      <Button type="submit" size="xs" disabled={pending} variant={decision === "rejected" ? "outline" : "default"}>
        {pending ? "Saving…" : decision === "approved" ? "Confirm approve" : "Confirm reject"}
      </Button>
      <Button type="button" size="xs" variant="ghost" onClick={() => setDecision(null)}>
        Cancel
      </Button>
      {error && (
        <span role="alert" className="flex items-center gap-1 text-[11px] text-destructive">
          <TriangleAlert className="size-3" aria-hidden />
          {error}
        </span>
      )}
    </form>
  );
}

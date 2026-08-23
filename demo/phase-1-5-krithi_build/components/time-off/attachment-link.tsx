"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";

import { getAttachmentUrl } from "@/actions/leave";

/**
 * Opens a sick-leave certificate.
 *
 * The storage path is never sent to the browser. Clicking asks the server to
 * authorise the caller and mint a 60-second signed URL, so the link in the DOM
 * is worthless until someone with permission clicks it, and worthless again a
 * minute later.
 */
export function AttachmentLink({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await getAttachmentUrl(requestId);
            if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
            else setError(result.error ?? "Could not open that document.");
          });
        }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : (
          <FileText className="size-3" aria-hidden />
        )}
        Certificate
      </button>
      {error && (
        <span role="alert" className="text-[11px] text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}

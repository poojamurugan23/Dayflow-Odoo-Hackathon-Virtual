"use client";

import { useActionState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { updateAvatar } from "@/actions/employees";
import { EMPTY_EDIT_STATE } from "@/lib/form-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/display";

/**
 * Avatar with an overlay picker. Choosing a file submits immediately — a
 * separate "upload" click after choosing is a step nobody wants.
 */
export function AvatarUpload({
  targetId,
  fullName,
  avatarUrl,
  editable,
}: {
  targetId: string;
  fullName: string;
  avatarUrl: string | null;
  editable: boolean;
}) {
  const [state, formAction] = useActionState(updateAvatar, EMPTY_EDIT_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  const face = (
    <Avatar className="size-20">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback className="text-lg">{initials(fullName)}</AvatarFallback>
    </Avatar>
  );

  if (!editable) return face;

  return (
    <form action={formAction} ref={formRef} className="shrink-0">
      <input type="hidden" name="targetId" value={targetId} />

      <label className="group relative block cursor-pointer rounded-full" title="Change picture">
        {face}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Overlay />
        </span>
        <input
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <span className="sr-only">Change profile picture</span>
      </label>

      {state.error && (
        <p role="alert" className="mt-2 max-w-[12rem] text-[11px] text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

function Overlay() {
  const { pending } = useFormStatus();
  return pending ? (
    <Loader2 className="size-5 animate-spin text-white" aria-hidden />
  ) : (
    <Camera className="size-5 text-white" aria-hidden />
  );
}

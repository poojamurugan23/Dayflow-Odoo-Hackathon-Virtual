import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The Odoo India · Dayflow lockup.
 *
 * Two tones, because it appears on two kinds of surface:
 *   "paper" — on the Violet Dusk gradient (sign in, sign up, password change).
 *   "ink"   — on a working surface, in the top nav.
 *
 * The 700 weight is loaded for this and only this: UI text stops at 600, so the
 * wordmark stays the heaviest thing in the typeface and does not compete with
 * headings.
 */
export function Lockup({
  orgName,
  logoUrl,
  orgCode,
  tone = "ink",
  size = "md",
  className,
}: {
  orgName?: string | null;
  logoUrl?: string | null;
  orgCode?: string | null;
  tone?: "paper" | "ink";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const paper = tone === "paper";

  const mark = size === "lg" ? "size-9" : size === "sm" ? "size-6" : "size-7";
  const word = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const org = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={36}
          height={36}
          className={cn(mark, "shrink-0 rounded-md object-cover")}
          unoptimized
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            mark,
            "flex shrink-0 items-center justify-center rounded-md font-semibold",
            size === "lg" ? "text-xs" : "text-[10px]",
            paper ? "bg-paper/20 text-paper ring-1 ring-paper/30" : "bg-plum text-paper",
          )}
        >
          {orgCode ?? "DF"}
        </span>
      )}

      <span className="flex min-w-0 flex-col leading-none">
        {orgName && (
          <span
            className={cn(
              org,
              "truncate font-medium uppercase tracking-[0.12em]",
              paper ? "text-paper/70" : "text-ink-2",
            )}
          >
            {orgName}
          </span>
        )}
        <span
          className={cn(
            word,
            "truncate font-bold tracking-tight",
            orgName && "mt-0.5",
            paper ? "text-paper" : "text-ink",
          )}
        >
          Dayflow
        </span>
      </span>
    </span>
  );
}

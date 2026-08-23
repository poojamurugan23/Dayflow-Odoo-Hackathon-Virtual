"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  fullName: string;
  loginId: string;
  roleLabel: string;
  avatarUrl: string | null;
  initials: string;
};

/** Avatar dropdown. Two items only — My Profile and Log Out — per the wireframe. */
export function UserMenu({ fullName, loginId, roleLabel, avatarUrl, initials }: UserMenuProps) {
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium text-foreground">{fullName}</span>
          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{loginId}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{roleLabel}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="size-4" aria-hidden />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign-out is a server action, so it goes through a real form submit
            rather than a client-side auth call. */}
        <form action={signOut} ref={signOutForm}>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              signOutForm.current?.requestSubmit();
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Log Out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

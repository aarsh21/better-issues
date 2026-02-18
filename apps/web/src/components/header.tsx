"use client";

import { ModeToggle } from "./mode-toggle";
import { UserMenu } from "./user-menu";
import { Separator } from "./ui/separator";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-3 py-1.5">
        <span className="text-sm font-bold tracking-tight">better-issues</span>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <Separator />
    </div>
  );
}

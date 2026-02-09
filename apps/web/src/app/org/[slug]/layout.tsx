"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

const SearchCommand = dynamic(
  () => import("@/components/search-command").then((m) => ({ default: m.SearchCommand })),
  { ssr: false },
);

export default function OrgSlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>();
  const [searchOpen, setSearchOpen] = useState(false);

  // Set active org on mount
  useEffect(() => {
    authClient.organization.setActive({ organizationSlug: params.slug });
  }, [params.slug]);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <ProjectSidebar onSearchOpen={openSearch} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with mobile menu + controls */}
        <div className="flex items-center justify-between border-b px-3 py-2 md:justify-end">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="sm" />}>
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <ProjectSidebar onSearchOpen={openSearch} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Right controls -- always visible, never overlapping */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {searchOpen && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
    </div>
  );
}

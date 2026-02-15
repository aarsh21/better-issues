"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useParams } from "@/lib/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { SearchCommand } from "@/components/search-command";
import { UserMenu } from "@/components/user-menu";
import { useActiveOrganization, useSetActiveOrganization } from "@/hooks/use-organization";

export const Route = createFileRoute("/org/$slug")({
  component: OrgSlugRoute,
});

function OrgSlugRoute() {
  return (
    <OrgSlugLayout>
      <Outlet />
    </OrgSlugLayout>
  );
}

export default function OrgSlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: activeOrg } = useActiveOrganization();
  const setActive = useSetActiveOrganization();
  const lastSyncedSlug = useRef<string | null>(null);

  // Only call setActive when the slug actually changes AND
  // the cached active org doesn't already match
  useEffect(() => {
    const slug = params.slug;
    if (lastSyncedSlug.current === slug) return;
    if (activeOrg && activeOrg.slug === slug) {
      lastSyncedSlug.current = slug;
      return;
    }
    lastSyncedSlug.current = slug;
    setActive.mutate({ organizationSlug: slug });
  }, [params.slug, activeOrg?.slug]);

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

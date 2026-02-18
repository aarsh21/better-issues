"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { CircleDot, PanelLeftIcon, Search, Settings } from "lucide-react";

import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "@/lib/navigation";
import { ProjectSidebar } from "@/components/project-sidebar";
import { SearchCommand } from "@/components/search-command";
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
  const params = Route.useParams();
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
    <TooltipProvider>
      <SidebarProvider>
        <ProjectSidebar onSearchOpen={openSearch} />

        <SidebarInset>
          {/*TODO: show org name in header, not just slug (need to fetch org data here or lift name up from sidebar)*/}
          <ContentHeader orgName={""} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </SidebarInset>

        {/* Fixed toolbar: toggle always visible, quick actions when collapsed */}
        <FloatingToolbar slug={params.slug} onSearchOpen={openSearch} />

        {searchOpen && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
      </SidebarProvider>
    </TooltipProvider>
  );
}

/* ── Content header — adapts padding when sidebar is collapsed ── */

function ContentHeader({ orgName }: { orgName: string }) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <header
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 border-b border-border transition-[padding] duration-200",
        isCollapsed ? "pl-40 pr-3" : "px-3",
      )}
    >
      {/* On mobile, keep the trigger in the header (Sheet-based sidebar) */}
      {isMobile && (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
        </>
      )}
      <span className="text-xs text-muted-foreground font-mono truncate">{orgName}</span>
    </header>
  );
}

/* ── Fixed toolbar — stays at same position regardless of sidebar state ── */

function FloatingToolbar({ slug, onSearchOpen }: { slug: string; onSearchOpen: () => void }) {
  const router = useRouter();
  const { state, isMobile } = useSidebar();

  // On mobile, sidebar uses Sheet overlay — no floating toolbar needed
  if (isMobile) return null;

  const isCollapsed = state === "collapsed";

  return (
    <div className="fixed top-0 left-0 z-20 flex h-10 items-center gap-1 px-2">
      <SidebarTrigger />

      {isCollapsed && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSearchOpen}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/org/${slug}`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <CircleDot className="size-4" />
            <span className="sr-only">Issues</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/org/${slug}/settings`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </>
      )}
    </div>
  );
}

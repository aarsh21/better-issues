"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { CircleDot, Command, Search, Settings } from "lucide-react";

import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "@/lib/navigation";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ActionCommand, IssueSearchCommand } from "@/components/search-command";
import {
  useActiveOrganization,
  useOrganizations,
  useSetActiveOrganization,
} from "@/hooks/use-organization";
import { matchesShortcut, useShortcutSettings } from "@/hooks/use-keybinds";

export const Route = createFileRoute("/org/$slug")({
  component: OrgSlugRoute,
});

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

function OrgSlugRoute() {
  return (
    <OrgSlugLayout>
      <Outlet />
    </OrgSlugLayout>
  );
}

export default function OrgSlugLayout({ children }: { children: React.ReactNode }) {
  const params = Route.useParams();
  const [activeCommand, setActiveCommand] = useState<"issueSearch" | "actionCommand" | null>(null);
  const { shortcuts } = useShortcutSettings();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useOrganizations();
  const setActive = useSetActiveOrganization();
  const lastSyncedSlug = useRef<string | null>(null);

  useEffect(() => {
    const slug = params.slug;
    const canResolveSlug =
      !organizations || organizations.some((organization) => organization.slug === slug);
    if (!canResolveSlug) {
      return;
    }

    if (lastSyncedSlug.current === slug) return;
    if (activeOrg && activeOrg.slug === slug) {
      lastSyncedSlug.current = slug;
      return;
    }
    lastSyncedSlug.current = slug;
    setActive.mutate({ organizationSlug: slug });
  }, [params.slug, activeOrg?.slug, organizations, setActive]);

  useEffect(() => {
    if (!organizations) {
      return;
    }

    const hasOrganization = organizations.some((organization) => organization.slug === params.slug);
    if (!hasOrganization) {
      router.replace("/org");
    }
  }, [organizations, params.slug, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) {
        return;
      }

      if (matchesShortcut(e, shortcuts.search)) {
        e.preventDefault();
        setActiveCommand("issueSearch");
        return;
      }

      if (matchesShortcut(e, shortcuts.commandPrompt)) {
        e.preventDefault();
        setActiveCommand("actionCommand");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  const openIssueSearch = useCallback(() => {
    setActiveCommand("issueSearch");
  }, []);

  const openActionCommand = useCallback(() => {
    setActiveCommand("actionCommand");
  }, []);

  const issueSearchOpen = activeCommand === "issueSearch";
  const actionCommandOpen = activeCommand === "actionCommand";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <ProjectSidebar onSearchOpen={openIssueSearch} onActionCommandOpen={openActionCommand} />

        <SidebarInset>
          <ContentHeader orgName={activeOrg?.name ?? ""} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </SidebarInset>

        <FloatingToolbar
          slug={params.slug}
          onSearchOpen={openIssueSearch}
          onActionCommandOpen={openActionCommand}
        />

        {issueSearchOpen && (
          <IssueSearchCommand
            open={issueSearchOpen}
            onOpenChange={(open) => {
              setActiveCommand(open ? "issueSearch" : null);
            }}
          />
        )}
        {actionCommandOpen && (
          <ActionCommand
            open={actionCommandOpen}
            onOpenChange={(open) => {
              setActiveCommand(open ? "actionCommand" : null);
            }}
            onIssueSearchOpen={openIssueSearch}
            shortcuts={shortcuts}
          />
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
}

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

function FloatingToolbar({
  slug,
  onSearchOpen,
  onActionCommandOpen,
}: {
  slug: string;
  onSearchOpen: () => void;
  onActionCommandOpen: () => void;
}) {
  const router = useRouter();
  const { state, isMobile } = useSidebar();

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
            onClick={onActionCommandOpen}
            className="text-muted-foreground hover:text-foreground"
          >
            <Command className="size-4" />
            <span className="sr-only">Commands</span>
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

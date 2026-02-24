"use client";

import type { Doc } from "@/convex";
import type { ShortcutSettings } from "@/hooks/use-keybinds";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
  Check,
  CircleDot,
  Loader2,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { api } from "@/convex";
import {
  useActiveOrganization,
  useOrganizations,
  useSetActiveOrganization,
} from "@/hooks/use-organization";
import { useRouter } from "@/lib/navigation";
import { formatShortcut } from "@/hooks/use-keybinds";

import { PriorityIndicator } from "@/components/issues/priority-indicator";
import { StatusIcon } from "@/components/issues/status-badge";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

const orgRouteApi = getRouteApi("/org/$slug");
type ThemeMode = "light" | "dark" | "system";
const SEARCH_DEBOUNCE_MS = 250;

type CommandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IssueSearchCommand({ open, onOpenChange }: CommandDialogProps) {
  const { slug } = orgRouteApi.useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: activeOrg } = useActiveOrganization();
  const trimmedSearchQuery = searchQuery.trim();
  const hasTypedQuery = trimmedSearchQuery.length > 0;
  const hasSearchQuery = hasTypedQuery && debouncedQuery.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(trimmedSearchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedSearchQuery]);

  const { data: issueResults, isFetching: isIssueSearchFetching } = useQuery(
    convexQuery(
      api.issues.search,
      activeOrg && hasSearchQuery
        ? {
            organizationId: activeOrg.id,
            searchQuery: debouncedQuery,
          }
        : "skip",
    ),
  );
  const { data: recentIssuesPage } = useQuery(
    convexQuery(
      api.issues.list,
      activeOrg
        ? {
            organizationId: activeOrg.id,
            paginationOpts: {
              cursor: null,
              numItems: 8,
            },
          }
        : "skip",
    ),
  );
  const recentIssues = recentIssuesPage?.page ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  };

  const navigateTo = (to: string) => {
    onOpenChange(false);
    router.push(to);
  };

  const handleSelectIssue = (issueNumber: number) => {
    navigateTo(`/org/${slug}/issues/${issueNumber}`);
  };

  const searchContextLabel = activeOrg ? `Team: ${activeOrg.name}` : "Search all issues";
  const isDebouncing = hasTypedQuery && debouncedQuery !== trimmedSearchQuery;
  const isSearchLoading = hasTypedQuery && (isDebouncing || isIssueSearchFetching);
  const issueCount = issueResults?.length ?? 0;
  const issueCountLabel = issueCount === 1 ? "1 issue found" : `${issueCount} issues found`;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Issue Search"
      description="Search all issues by title, number, status, and priority."
    >
      <Command>
        <div className="border-b border-border/70 px-3 py-2">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
            {searchContextLabel}
          </p>
        </div>
        <CommandInput
          placeholder="Search all issues..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        {hasTypedQuery && (
          <div className="text-muted-foreground flex items-center gap-2 border-b border-border/70 px-3 py-1.5 text-xs">
            {isSearchLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Searching issues...</span>
              </>
            ) : (
              <>
                <Search className="size-3.5" />
                <span>{issueCountLabel}</span>
              </>
            )}
          </div>
        )}
        <CommandList
          className={isSearchLoading ? "opacity-60 transition-opacity" : "transition-opacity"}
        >
          <CommandEmpty>
            {hasTypedQuery
              ? isSearchLoading
                ? "Searching issues..."
                : "No issues found."
              : "Type to search issues..."}
          </CommandEmpty>

          {hasSearchQuery && issueResults && issueResults.length > 0 && (
            <CommandGroup heading="Issues">
              {issueResults.map((issue) => (
                <CommandItem
                  key={issue._id}
                  value={`${issue.number} ${issue.title}`}
                  onSelect={() => handleSelectIssue(issue.number)}
                  className="cursor-pointer"
                >
                  <div className="flex w-full items-center gap-3">
                    <StatusIcon status={issue.status} />
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      #{issue.number}
                    </span>
                    <span className="truncate text-sm">{issue.title}</span>
                    <div className="ml-auto">
                      <PriorityIndicator priority={issue.priority} />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!hasTypedQuery && recentIssues.length > 0 && (
            <CommandGroup heading="Recent Issues">
              {recentIssues.map((issue) => (
                <CommandItem
                  key={issue._id}
                  value={`${issue.number} ${issue.title} recent`}
                  onSelect={() => handleSelectIssue(issue.number)}
                  className="cursor-pointer"
                >
                  <div className="flex w-full items-center gap-3">
                    <StatusIcon status={issue.status} />
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      #{issue.number}
                    </span>
                    <span className="truncate text-sm">{issue.title}</span>
                    <div className="ml-auto">
                      <PriorityIndicator priority={issue.priority} />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

type ActionCommandProps = CommandDialogProps & {
  onIssueSearchOpen?: () => void;
  shortcuts: ShortcutSettings;
};

export function ActionCommand({
  open,
  onOpenChange,
  onIssueSearchOpen,
  shortcuts,
}: ActionCommandProps) {
  const { slug } = orgRouteApi.useParams();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useOrganizations();
  const setActiveOrganization = useSetActiveOrganization();
  const { theme, setTheme } = useTheme();
  const { data: templates } = useQuery(
    convexQuery(api.templates.list, activeOrg ? { organizationId: activeOrg.id } : "skip"),
  );

  const navigateTo = (to: string) => {
    onOpenChange(false);
    router.push(to);
  };

  const handleSwitchTeam = (organizationSlug: string) => {
    onOpenChange(false);

    if (organizationSlug === activeOrg?.slug) {
      return;
    }

    router.push(`/org/${organizationSlug}`);
    setActiveOrganization.mutate({ organizationSlug });
  };

  const handleSwitchTheme = (nextTheme: ThemeMode) => {
    onOpenChange(false);
    setTheme(nextTheme);
  };

  const handleOpenIssueSearch = () => {
    onOpenChange(false);
    onIssueSearchOpen?.();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Commands"
      description="Run navigation and workspace actions."
    >
      <Command>
        <div className="border-b border-border/70 px-3 py-2">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
            {formatShortcut(shortcuts.commandPrompt)}
          </p>
        </div>
        <CommandInput placeholder="Search options..." />
        <CommandList>
          <CommandEmpty>No options found.</CommandEmpty>

          <CommandGroup heading="Quick Actions">
            <CommandItem
              value={`search issues ${slug}`}
              onSelect={handleOpenIssueSearch}
              className="cursor-pointer"
            >
              <Search className="size-3.5" />
              <span className="text-sm">Search Issues</span>
              <CommandShortcut>{formatShortcut(shortcuts.search)}</CommandShortcut>
            </CommandItem>
            <CommandItem
              value={`issues ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}`)}
              className="cursor-pointer"
            >
              <CircleDot className="size-3.5" />
              <span className="text-sm">All Issues</span>
            </CommandItem>
            <CommandItem
              value={`issues open ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}?status=open`)}
              className="cursor-pointer"
            >
              <span className="text-sm">Open Issues</span>
            </CommandItem>
            <CommandItem
              value={`issues in progress ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}?status=in_progress`)}
              className="cursor-pointer"
            >
              <span className="text-sm">In Progress Issues</span>
            </CommandItem>
            <CommandItem
              value={`issues closed ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}?status=closed`)}
              className="cursor-pointer"
            >
              <span className="text-sm">Closed Issues</span>
            </CommandItem>
            <CommandItem
              value={`settings ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}/settings`)}
              className="cursor-pointer"
            >
              <Settings className="size-3.5" />
              <span className="text-sm">Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="New Issue">
            <CommandItem
              value={`new issue blank ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}/issues/new?template=blank`)}
              className="cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span className="text-sm">Blank Issue</span>
            </CommandItem>
            {templates?.map((template: Doc<"issueTemplates">) => (
              <CommandItem
                key={template._id}
                value={`new issue template ${template.name} ${slug}`}
                onSelect={() =>
                  navigateTo(`/org/${slug}/issues/new?template=${encodeURIComponent(template._id)}`)
                }
                className="cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span className="truncate text-sm">Use Template: {template.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {organizations && organizations.length > 0 && (
            <CommandGroup heading="Switch Team">
              {organizations.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={`team ${organization.name} ${organization.slug}`}
                  onSelect={() => handleSwitchTeam(organization.slug)}
                  className="cursor-pointer"
                >
                  <span className="truncate text-sm">{organization.name}</span>
                  {organization.slug === activeOrg?.slug && <Check className="ml-auto size-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Mode">
            <CommandItem
              value="mode light theme"
              onSelect={() => handleSwitchTheme("light")}
              className="cursor-pointer"
            >
              <Sun className="size-3.5" />
              <span className="text-sm">Light</span>
              {theme === "light" && <Check className="ml-auto size-3.5" />}
            </CommandItem>
            <CommandItem
              value="mode dark theme"
              onSelect={() => handleSwitchTheme("dark")}
              className="cursor-pointer"
            >
              <Moon className="size-3.5" />
              <span className="text-sm">Dark</span>
              {theme === "dark" && <Check className="ml-auto size-3.5" />}
            </CommandItem>
            <CommandItem
              value="mode system theme"
              onSelect={() => handleSwitchTheme("system")}
              className="cursor-pointer"
            >
              <Monitor className="size-3.5" />
              <span className="text-sm">System</span>
              {theme === "system" && <Check className="ml-auto size-3.5" />}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

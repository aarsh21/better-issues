"use client";

import type { Doc } from "@/convex";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Check, Monitor, Moon, Plus, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useDeferredValue, useState } from "react";

import { useRouter } from "@/lib/navigation";
import { api } from "@/convex";
import {
  useActiveOrganization,
  useOrganizations,
  useSetActiveOrganization,
} from "@/hooks/use-organization";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { StatusIcon } from "@/components/issues/status-badge";
import { PriorityIndicator } from "@/components/issues/priority-indicator";

const orgRouteApi = getRouteApi("/org/$slug");
type ThemeMode = "light" | "dark" | "system";

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { slug } = orgRouteApi.useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useOrganizations();
  const setActiveOrganization = useSetActiveOrganization();
  const { theme, setTheme } = useTheme();
  const hasSearchQuery = deferredQuery.trim().length > 0;

  const { data: issueResults } = useQuery(
    convexQuery(
      api.issues.search,
      activeOrg && hasSearchQuery
        ? {
            organizationId: activeOrg.id,
            searchQuery: deferredQuery,
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
  const { data: templates } = useQuery(
    convexQuery(api.templates.list, activeOrg ? { organizationId: activeOrg.id } : "skip"),
  );
  const recentIssues = recentIssuesPage?.page ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setSearchQuery("");
  };

  const navigateTo = (to: string) => {
    onOpenChange(false);
    router.push(to);
  };

  const handleSelectIssue = (issueNumber: number) => {
    navigateTo(`/org/${slug}/issues/${issueNumber}`);
  };

  const handleSwitchTeam = (organizationSlug: string) => {
    onOpenChange(false);
    setActiveOrganization.mutate(
      { organizationSlug },
      { onSuccess: () => router.push(`/org/${organizationSlug}`) },
    );
  };

  const handleSwitchTheme = (nextTheme: ThemeMode) => {
    onOpenChange(false);
    setTheme(nextTheme);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command>
        <CommandInput
          placeholder="Search issues..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className={isStale ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <CommandEmpty>
            {searchQuery.trim()
              ? isStale
                ? "Searching..."
                : "No commands or issues found."
              : "Type to search issues or commands..."}
          </CommandEmpty>

          <CommandGroup heading="Go To">
            <CommandItem
              value={`issues ${slug}`}
              onSelect={() => navigateTo(`/org/${slug}`)}
              className="cursor-pointer"
            >
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

          {hasSearchQuery && issueResults && issueResults.length > 0 && (
            <CommandGroup heading="Issues">
              {issueResults.map(
                (issue: {
                  _id: string;
                  number: number;
                  title: string;
                  status: "open" | "in_progress" | "closed";
                  priority: "low" | "medium" | "high" | "urgent";
                }) => (
                  <CommandItem
                    key={issue._id}
                    value={`${issue.number} ${issue.title}`}
                    onSelect={() => handleSelectIssue(issue.number)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <StatusIcon status={issue.status} />
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        #{issue.number}
                      </span>
                      <span className="truncate text-sm">{issue.title}</span>
                      <div className="ml-auto">
                        <PriorityIndicator priority={issue.priority} />
                      </div>
                    </div>
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          )}

          {!hasSearchQuery && recentIssues.length > 0 && (
            <CommandGroup heading="Recent Issues">
              {recentIssues.map((issue) => (
                <CommandItem
                  key={issue._id}
                  value={`${issue.number} ${issue.title} recent`}
                  onSelect={() => handleSelectIssue(issue.number)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <StatusIcon status={issue.status} />
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
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

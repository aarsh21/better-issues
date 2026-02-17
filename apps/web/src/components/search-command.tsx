"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";

import { useRouter } from "@/lib/navigation";
import { api } from "@/convex";

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
import { useActiveOrganization } from "@/hooks/use-organization";

const orgRouteApi = getRouteApi("/org/$slug");

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

  const { data: results } = useQuery(
    convexQuery(
      api.issues.search,
      activeOrg && deferredQuery.trim()
        ? {
            organizationId: activeOrg.id,
            searchQuery: deferredQuery,
          }
        : "skip",
    ),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setSearchQuery("");
  };

  const handleSelect = (issueNumber: number) => {
    onOpenChange(false);
    router.push(`/org/${slug}/issues/${issueNumber}`);
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
                : "No issues found."
              : "Type to search issues..."}
          </CommandEmpty>
          {results && results.length > 0 && (
            <CommandGroup heading="Issues">
              {results.map(
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
                    onSelect={() => handleSelect(issue.number)}
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
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

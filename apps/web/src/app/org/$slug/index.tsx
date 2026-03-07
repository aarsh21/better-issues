"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";

import { apiClient, labelsQueryOptions } from "@better-issues/api-client";
import type { CursorPage, IssueListItemDto } from "@better-issues/api-client";

import { IssueRow } from "@/components/issues/issue-row";
import { FilterBar } from "@/components/issues/filter-bar";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useActiveOrganization, useOrganizations } from "@/hooks/use-organization";
import { unwrapResponse } from "@/lib/api";
import { setIssueListSnapshot } from "@/lib/issue-snapshot-cache";

type IssueStatus = "open" | "in_progress" | "closed";

const ISSUE_STATUSES = new Set<IssueStatus>(["open", "in_progress", "closed"]);

export const Route = createFileRoute("/org/$slug/")({
  validateSearch: (search) => ({
    status:
      typeof search.status === "string" && ISSUE_STATUSES.has(search.status as IssueStatus)
        ? (search.status as IssueStatus)
        : undefined,
  }),
  component: IssueListPage,
});

function IssueListPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: activeOrganization } = useActiveOrganization();
  const { data: organizations } = useOrganizations();

  const organizationId =
    activeOrganization?.slug === slug
      ? activeOrganization.id
      : organizations?.find((organization) => organization.slug === slug)?.id;

  const labels = useQuery({
    ...labelsQueryOptions(organizationId ?? ""),
    enabled: !!organizationId,
  });

  const issues = useInfiniteQuery<CursorPage<IssueListItemDto>, Error>({
    queryKey: ["issues", "infinite", organizationId, search.status],
    enabled: !!organizationId,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      unwrapResponse(
        apiClient.api.v1.issues.get({
          query: {
            organizationId: organizationId!,
            cursor: pageParam ?? undefined,
            status: search.status,
          },
        }),
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const items = issues.data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    if (!organizationId || items.length === 0) {
      return;
    }

    setIssueListSnapshot(organizationId, search.status, items);
  }, [items, organizationId, search.status]);

  const handleStatusChange = (nextStatus: IssueStatus | undefined) => {
    void navigate({
      to: ".",
      replace: true,
      search: (previous) => ({
        ...previous,
        status: nextStatus,
      }),
    });
  };

  const isLoading = !organizationId || issues.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold">Issues</h1>
          {!isLoading && items.length > 0 ? (
            <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
          ) : null}
          <FilterBar activeStatus={search.status} onStatusChange={handleStatusChange} />
        </div>
        <Link href={`/org/${slug}/issues/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Issue
          </Button>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <IssueListSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="mb-1 text-sm font-medium">No issues yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              {search.status
                ? "No issues match the current filter."
                : "Create your first issue to get started."}
            </p>
            {!search.status ? (
              <Link href={`/org/${slug}/issues/new`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New Issue
                </Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <div>
            {items.map((issue) => (
              <IssueRow key={issue._id} issue={issue} labels={labels.data ?? []} />
            ))}

            {issues.hasNextPage ? (
              <div className="flex justify-center border-b border-border py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={issues.isFetchingNextPage}
                  onClick={() => {
                    void issues.fetchNextPage();
                  }}
                  className="text-xs text-muted-foreground"
                >
                  {issues.isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            ) : null}

            {issues.isFetchingNextPage ? (
              <div className="flex justify-center border-b border-border py-3">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : null}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function IssueListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

export default IssueListPage;

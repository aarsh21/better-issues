"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

import { Suspense, useEffect } from "react";

import { api } from "@/convex";
import { queryClient } from "@/components/providers";
import { usePaginatedQuery } from "convex/react";
import { Plus } from "lucide-react";
import { Link } from "@/components/ui/link";
import { prefetchOrgRouteData } from "@/lib/route-prefetch";
import { getIssueListSnapshot, setIssueListSnapshot } from "@/lib/issue-snapshot-cache";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { FilterBar } from "@/components/issues/filter-bar";
import { IssueRow } from "@/components/issues/issue-row";
import { useActiveOrganization, useOrganizations } from "@/hooks/use-organization";

type IssueStatus = "open" | "in_progress" | "closed";
const ISSUE_STATUSES = new Set<IssueStatus>(["open", "in_progress", "closed"]);

export const Route = createFileRoute("/org/$slug/")({
  validateSearch: (search) => ({
    status:
      typeof search.status === "string" && ISSUE_STATUSES.has(search.status as IssueStatus)
        ? (search.status as IssueStatus)
        : undefined,
  }),
  loader: ({ params }) => {
    void prefetchOrgRouteData(`/org/${encodeURIComponent(params.slug)}`, queryClient);
  },
  component: IssueListPage,
});

export default function IssueListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-bold">Issues</h1>
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <IssueListContent />
    </Suspense>
  );
}

function IssueListContent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const params = Route.useParams();
  const search = Route.useSearch();
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useOrganizations();
  const statusFilter = search.status;
  const organizationId =
    activeOrg?.slug === params.slug
      ? activeOrg.id
      : organizations?.find((organization) => organization.slug === params.slug)?.id;

  const { results, status, loadMore } = usePaginatedQuery(
    api.issues.list,
    organizationId
      ? {
          organizationId,
          status: statusFilter,
        }
      : "skip",
    { initialNumItems: 25 },
  );

  const { data: labels } = useQuery(
    convexQuery(api.labels.list, organizationId ? { organizationId } : "skip"),
  );

  const cachedResults = organizationId
    ? getIssueListSnapshot(organizationId, statusFilter)
    : undefined;
  const displayResults = status === "LoadingFirstPage" ? (cachedResults ?? results) : results;
  const isInitialLoading = !organizationId || (status === "LoadingFirstPage" && !cachedResults);

  useEffect(() => {
    if (!organizationId || status === "LoadingFirstPage") {
      return;
    }

    setIssueListSnapshot(organizationId, statusFilter, results);
  }, [organizationId, results, status, statusFilter]);

  const handleStatusChange = (nextStatus: IssueStatus | undefined) => {
    void navigate({
      to: ".",
      replace: true,
      search: (prev) => ({
        ...prev,
        status: nextStatus,
      }),
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold">Issues</h1>
          {!isInitialLoading && displayResults.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {displayResults.length}
              {status === "CanLoadMore" ? "+" : ""}
            </span>
          )}
          <FilterBar activeStatus={statusFilter} onStatusChange={handleStatusChange} />
        </div>
        <Link href={`/org/${params.slug}/issues/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Issue
          </Button>
        </Link>
      </div>

      {/* Issue list */}
      <ScrollArea className="flex-1">
        {isInitialLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        ) : displayResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="mb-1 text-sm font-medium">No issues yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              {statusFilter
                ? "No issues match the current filter."
                : "Create your first issue to get started."}
            </p>
            {!statusFilter && (
              <Link href={`/org/${params.slug}/issues/new`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New Issue
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div>
            {displayResults.map((issue) => (
              <IssueRow key={issue._id} issue={issue} labels={labels ?? []} />
            ))}

            {status === "CanLoadMore" && (
              <div className="flex justify-center border-b border-border py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadMore(25)}
                  className="text-xs text-muted-foreground"
                >
                  Load more
                </Button>
              </div>
            )}

            {status === "LoadingMore" && (
              <div className="flex justify-center border-b border-border py-3">
                <Spinner className="text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

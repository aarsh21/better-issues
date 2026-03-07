"use client";

import type { Doc } from "@/lib/api-contracts";

import { getRouteApi } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils";

import { LabelBadge } from "./label-badge";
import { PriorityIndicator } from "./priority-indicator";
import { StatusIcon } from "./status-badge";

type Issue = Doc<"issues">;
type Label = Doc<"labels">;

const orgRouteApi = getRouteApi("/org/$slug");

export function IssueRow({ issue, labels }: { issue: Issue; labels: Label[] }) {
  const { slug } = orgRouteApi.useParams();
  const issueLabels = labels.filter((label) => issue.labelIds.includes(label._id));

  return (
    <Link
      href={`/org/${slug}/issues/${issue.number}`}
      className={cn(
        "group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-accent",
        issue.status === "closed" ? "opacity-60" : "",
      )}
    >
      <StatusIcon status={issue.status} />
      <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        #{issue.number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              issue.status === "closed" ? "line-through" : "",
            )}
          >
            {issue.title}
          </span>
          {issueLabels.map((label) => (
            <LabelBadge key={label._id} name={label.name} color={label.color} />
          ))}
        </div>
      </div>
      <PriorityIndicator priority={issue.priority} />
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

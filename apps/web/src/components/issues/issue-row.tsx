"use client";

import type { Route } from "next";
import type { Doc } from "@/convex";

import { ChevronRight } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useParams } from "next/navigation";

import { cn } from "@/lib/utils";

import { StatusIcon } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { LabelBadge } from "./label-badge";

type Issue = Doc<"issues">;
type Label = Doc<"labels">;

export function IssueRow({ issue, labels }: { issue: Issue; labels: Label[] }) {
  const params = useParams<{ slug: string }>();
  const issueLabels = labels.filter((l) => issue.labelIds.includes(l._id));

  return (
    <Link
      href={`/org/${params.slug}/issues/${issue.number}` as Route}
      className={cn(
        "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent cursor-pointer group",
        issue.status === "closed" && "opacity-60",
      )}
    >
      <StatusIcon status={issue.status} />

      <span className="text-xs text-muted-foreground font-mono shrink-0 w-10 text-right transition-colors group-hover:text-foreground">
        #{issue.number}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium truncate",
              issue.status === "closed" && "line-through",
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

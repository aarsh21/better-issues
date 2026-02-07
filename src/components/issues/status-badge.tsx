"use client";

import { Circle, CircleDot, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: Circle,
    className: "text-foreground border-border",
  },
  in_progress: {
    label: "In Progress",
    icon: CircleDot,
    className: "text-chart-2 border-chart-2/30 bg-chart-2/10",
  },
  closed: {
    label: "Closed",
    icon: CircleCheck,
    className: "text-muted-foreground border-border bg-muted",
  },
} as const;

type IssueStatus = keyof typeof STATUS_CONFIG;

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function StatusIcon({ status, className }: { status: IssueStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return <Icon className={cn("h-4 w-4", config.className, className)} />;
}

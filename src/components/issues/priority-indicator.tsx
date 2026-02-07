"use client";

import { SignalHigh, SignalMedium, SignalLow, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    className: "text-destructive",
  },
  high: {
    label: "High",
    icon: SignalHigh,
    className: "text-foreground",
  },
  medium: {
    label: "Medium",
    icon: SignalMedium,
    className: "text-muted-foreground",
  },
  low: {
    label: "Low",
    icon: SignalLow,
    className: "text-muted-foreground/60",
  },
} as const;

type IssuePriority = keyof typeof PRIORITY_CONFIG;

export function PriorityIndicator({
  priority,
  showLabel = false,
  className,
}: {
  priority: IssuePriority;
  showLabel?: boolean;
  className?: string;
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && config.label}
    </span>
  );
}

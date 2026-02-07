"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IssueStatus = "open" | "in_progress" | "closed";

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

export function FilterBar({
  activeStatus,
  onStatusChange,
}: {
  activeStatus: IssueStatus | undefined;
  onStatusChange: (status: IssueStatus | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onStatusChange(activeStatus === option.value ? undefined : option.value)}
          className={cn(
            "inline-flex items-center border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
            activeStatus === option.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
      {activeStatus && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStatusChange(undefined)}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

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
        <Button
          key={option.value}
          variant={activeStatus === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(activeStatus === option.value ? undefined : option.value)}
        >
          {option.label}
        </Button>
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

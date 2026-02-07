"use client";

import { Button } from "@/components/ui/button";

export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm space-y-4 p-8 text-center">
        <h2 className="text-sm font-bold">Something went wrong</h2>
        <p className="text-xs text-muted-foreground">
          {error.digest ? `Error ID: ${error.digest}` : "Failed to load this page."}
        </p>
        <Button size="sm" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}

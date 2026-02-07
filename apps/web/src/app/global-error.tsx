"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex h-svh items-center justify-center bg-background font-mono text-foreground antialiased">
        <div className="max-w-sm space-y-4 p-8 text-center">
          <h2 className="text-sm font-bold">Something went wrong</h2>
          <p className="text-xs text-muted-foreground">
            {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="border border-border bg-card px-4 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

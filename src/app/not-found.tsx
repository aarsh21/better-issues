import { Link } from "@/components/ui/link";

export default function NotFound() {
  return (
    <div className="flex h-svh items-center justify-center">
      <div className="max-w-sm space-y-4 p-8 text-center">
        <h2 className="text-sm font-bold">Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center border border-border bg-card px-4 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

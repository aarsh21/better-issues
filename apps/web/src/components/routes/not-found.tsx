import { Link } from "@/components/ui/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-svh items-center justify-center">
      <div className="max-w-sm space-y-4 p-8 text-center">
        <h2 className="text-sm font-bold">Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}

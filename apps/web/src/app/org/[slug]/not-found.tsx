import { Link } from "@/components/ui/link";

import { Button } from "@/components/ui/button";

export default function OrgNotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm space-y-4 p-8 text-center">
        <h2 className="text-sm font-bold">Organization not found</h2>
        <p className="text-xs text-muted-foreground">
          The workspace you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/org">
          <Button size="sm" variant="outline">
            Back to workspaces
          </Button>
        </Link>
      </div>
    </div>
  );
}

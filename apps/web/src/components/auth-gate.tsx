"use client";

import { useEffect } from "react";

import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/lib/navigation";

import { Skeleton } from "./ui/skeleton";

export function AuthGate({
  children,
  fallbackTo = "/sign-in",
}: {
  children: React.ReactNode;
  fallbackTo?: string;
}) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data?.session) {
      router.replace(fallbackTo);
    }
  }, [fallbackTo, router, session.data?.session, session.isPending]);

  if (session.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    );
  }

  if (!session.data?.session) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "@/lib/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/org")({
  component: OrgRoute,
});

function OrgRoute() {
  return (
    <OrgRootLayout>
      <Outlet />
    </OrgRootLayout>
  );
}

function UnauthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);
  return null;
}

export default function OrgRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-svh bg-background">
      <AuthLoading>
        <div className="flex h-full items-center justify-center">
          <div className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthRedirect />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </div>
  );
}

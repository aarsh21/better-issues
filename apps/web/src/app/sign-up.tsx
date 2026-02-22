"use client";

import { createFileRoute } from "@tanstack/react-router";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "@/lib/navigation";
import { Suspense, useEffect } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import SignUpForm from "@/components/sign-up-form";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@better-issues/env/web";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search) => ({
    returnTo:
      typeof search.returnTo === "string" && search.returnTo.startsWith("/")
        ? search.returnTo
        : undefined,
  }),
  component: SignUpPage,
});

function AuthenticatedRedirect() {
  const router = useRouter();
  const { returnTo } = Route.useSearch();

  useEffect(() => {
    router.replace(returnTo ?? "/org");
  }, [router, returnTo]);
  return null;
}

export default function SignUpPage() {
  const isSignupsEnabled = env.NEXT_PUBLIC_ALLOWED_SIGNUPS !== "false";
  const { returnTo } = Route.useSearch();
  const signInHref = returnTo ? `/sign-in?returnTo=${encodeURIComponent(returnTo)}` : "/sign-in";

  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <AuthLoading>
        <div className="w-full max-w-sm space-y-4 p-8">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <Suspense fallback={null}>
          <AuthenticatedRedirect />
        </Suspense>
      </Authenticated>
      <Unauthenticated>
        <div className="w-full max-w-sm p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight">better-issues</h1>
              <p className="text-xs text-muted-foreground">Issue tracking for small teams</p>
            </div>
            <ModeToggle />
          </div>
          {isSignupsEnabled ? (
            <>
              <SignUpForm redirectTo={returnTo} />
              <p className="pt-3 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href={signInHref} className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Sign ups are disabled by the admin.
            </p>
          )}
        </div>
      </Unauthenticated>
    </div>
  );
}

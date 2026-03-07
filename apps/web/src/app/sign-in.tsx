"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { env } from "@better-issues/env/web";

import { ModeToggle } from "@/components/mode-toggle";
import SignInForm from "@/components/sign-in-form";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/lib/navigation";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search) => ({
    returnTo:
      typeof search.returnTo === "string" && search.returnTo.startsWith("/")
        ? search.returnTo
        : undefined,
  }),
  component: SignInPage,
});

function AuthenticatedRedirect() {
  const router = useRouter();
  const { returnTo } = Route.useSearch();

  useEffect(() => {
    router.replace(returnTo ?? "/org");
  }, [router, returnTo]);

  return null;
}

export default function SignInPage() {
  const isSignupsEnabled = env.ALLOWED_SIGNUPS !== "false";
  const { returnTo } = Route.useSearch();
  const session = useSession();
  const signUpHref = returnTo ? `/sign-up?returnTo=${encodeURIComponent(returnTo)}` : "/sign-up";

  if (session.isPending) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-8">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (session.data?.session) {
    return <AuthenticatedRedirect />;
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">better-issues</h1>
            <p className="text-xs text-muted-foreground">Issue tracking for small teams</p>
          </div>
          <ModeToggle />
        </div>
        <SignInForm redirectTo={returnTo} />
        {!isSignupsEnabled ? (
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Sign ups are disabled by the admin.
          </p>
        ) : (
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Need an account?{" "}
            <Link href={signUpHref} className="text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { createFileRoute } from "@tanstack/react-router";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "@/lib/navigation";
import { Suspense, useEffect } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import SignInForm from "@/components/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "@better-issues/env/web";

import SignUpForm from "@/components/sign-up-form";

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
  const isSignupsEnabled = env.NEXT_PUBLIC_ALLOWED_SIGNUPS !== "false";

  console.info(
    `[better-issues] Sign ups ${isSignupsEnabled ? "enabled" : "disabled"} via NEXT_PUBLIC_ALLOWED_SIGNUPS`,
  );

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
          <Tabs defaultValue="sign-in">
            <TabsList className="w-full">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              {isSignupsEnabled ? <TabsTrigger value="sign-up">Sign Up</TabsTrigger> : null}
            </TabsList>
            {!isSignupsEnabled ? (
              <p className="pt-3 text-xs text-muted-foreground">
                Sign ups are disabled by the admin.
              </p>
            ) : null}
            <TabsContent value="sign-in" className="pt-4">
              <SignInForm />
            </TabsContent>
            {isSignupsEnabled ? (
              <TabsContent value="sign-up" className="pt-4">
                <SignUpForm />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </Unauthenticated>
    </div>
  );
}

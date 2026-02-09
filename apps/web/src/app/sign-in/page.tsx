"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AuthenticatedRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/org");
  }, [router]);
  return null;
}

export default function SignInPage() {
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
        <AuthenticatedRedirect />
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
              <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in" className="pt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="sign-up" className="pt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </Unauthenticated>
    </div>
  );
}

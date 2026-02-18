"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Link } from "@/components/ui/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingCTA() {
  return (
    <>
      <Authenticated>
        <Link
          href="/org"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
        >
          Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Authenticated>
      <Unauthenticated>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
        >
          Sign in
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Unauthenticated>
    </>
  );
}

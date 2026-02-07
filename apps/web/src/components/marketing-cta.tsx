"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MarketingCTA() {
  return (
    <>
      <Authenticated>
        <Link
          href="/org"
          className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Authenticated>
      <Unauthenticated>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Unauthenticated>
    </>
  );
}

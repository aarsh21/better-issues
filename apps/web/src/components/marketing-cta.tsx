"use client";

import { ArrowRight } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

export function MarketingCTA() {
  const session = useSession();
  const href = session.data?.session ? "/org" : "/sign-in";
  const label = session.data?.session ? "Dashboard" : "Sign in";

  return (
    <Link href={href} className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}>
      {label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

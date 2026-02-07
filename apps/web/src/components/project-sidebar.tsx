"use client";

import { CircleDot, Settings, Plus, Search, Tag, LayoutList } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { OrgSwitcher } from "./org-switcher";
import { CreateOrgDialog } from "./create-org-dialog";

export function ProjectSidebar({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();
  const slug = params.slug;
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const navItems = [
    {
      href: `/org/${slug}` as const,
      label: "Issues",
      icon: CircleDot,
      active: pathname === `/org/${slug}`,
    },
    {
      href: `/org/${slug}/settings` as const,
      label: "Settings",
      icon: Settings,
      active: pathname.startsWith(`/org/${slug}/settings`),
    },
  ];

  return (
    <>
      <div className="flex h-full w-60 flex-col border-r bg-background">
        <div className="p-3">
          <OrgSwitcher onCreateOrg={() => setCreateOrgOpen(true)} />
        </div>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm text-muted-foreground"
            onClick={onSearchOpen}
          >
            <Search className="h-3.5 w-3.5" />
            Search issues...
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              K
            </kbd>
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors",
                  item.active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Separator className="my-2" />

          <div className="p-2">
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quick filters
            </p>
            <Link
              href={`/org/${slug}?status=open`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Open issues
            </Link>
            <Link
              href={`/org/${slug}?status=in_progress`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <CircleDot className="h-3.5 w-3.5" />
              In progress
            </Link>
            <Link
              href={`/org/${slug}?status=closed`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Tag className="h-3.5 w-3.5" />
              Closed
            </Link>
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-3">
          <Link href={`/org/${slug}/issues/new`}>
            <Button className="w-full gap-2" size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </Button>
          </Link>
        </div>
      </div>

      <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </>
  );
}

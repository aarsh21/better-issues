"use client";

import { Suspense } from "react";
import { CircleDot, Settings, Plus, Search, Tag, LayoutList } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useParams, usePathname, useSearchParams } from "@/lib/navigation";
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
      href: `/org/${slug}`,
      label: "Issues",
      icon: CircleDot,
      active: pathname === `/org/${slug}`,
    },
    {
      href: `/org/${slug}/settings`,
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

          <Suspense
            fallback={
              <div className="p-2">
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quick filters
                </p>
                <QuickFilterLink
                  href={`/org/${slug}?status=open`}
                  icon={LayoutList}
                  label="Open issues"
                  active={false}
                />
                <QuickFilterLink
                  href={`/org/${slug}?status=in_progress`}
                  icon={CircleDot}
                  label="In progress"
                  active={false}
                />
                <QuickFilterLink
                  href={`/org/${slug}?status=closed`}
                  icon={Tag}
                  label="Closed"
                  active={false}
                />
              </div>
            }
          >
            <QuickFilters slug={slug} pathname={pathname} />
          </Suspense>
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

/* ── Inner components ─────────────────────────────────────────── */

function QuickFilterLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href as never}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function QuickFilters({ slug, pathname }: { slug: string; pathname: string }) {
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status");
  const isOnIssuesPage = pathname === `/org/${slug}`;

  return (
    <div className="p-2">
      <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Quick filters
      </p>
      <QuickFilterLink
        href={`/org/${slug}?status=open`}
        icon={LayoutList}
        label="Open issues"
        active={isOnIssuesPage && activeStatus === "open"}
      />
      <QuickFilterLink
        href={`/org/${slug}?status=in_progress`}
        icon={CircleDot}
        label="In progress"
        active={isOnIssuesPage && activeStatus === "in_progress"}
      />
      <QuickFilterLink
        href={`/org/${slug}?status=closed`}
        icon={Tag}
        label="Closed"
        active={isOnIssuesPage && activeStatus === "closed"}
      />
    </div>
  );
}

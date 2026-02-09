"use client";

import { Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { CreateOrgDialog } from "@/components/create-org-dialog";
import { authClient } from "@/lib/auth-client";

export default function OrgListPage() {
  const { data: orgs, isPending } = authClient.useListOrganizations();
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const handleTeamClick = async (slug: string) => {
    await authClient.organization.setActive({ organizationSlug: slug });
    router.push(`/org/${slug}`);
  };

  // If user has exactly one team, auto-redirect
  useEffect(() => {
    if (orgs && orgs.length === 1 && orgs[0]) {
      handleTeamClick(orgs[0].slug);
    }
  }, [orgs]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-sm font-bold tracking-tight">better-issues</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Team
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-1 text-lg font-medium">Your Teams</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Select a team to view its issues, or create a new one.
          </p>

          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orgs && orgs.length > 0 ? (
            <div className="space-y-2">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleTeamClick(org.slug)}
                  className="flex w-full items-center justify-between border bg-card p-4 text-left transition-colors hover:bg-accent cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed p-12 text-center">
              <p className="mb-1 text-sm font-medium">No teams yet</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Create your first team to start tracking issues.
              </p>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create Team
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

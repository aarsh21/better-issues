"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrganization, useSetActiveOrganization } from "@/hooks/use-organization";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const router = useRouter();
  const createOrg = useCreateOrganization();
  const setActive = useSetActiveOrganization();

  const loading = createOrg.isPending || setActive.isPending;

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    const createResult = await createOrg
      .mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
      })
      .then(
        (value) => ({ ok: true, value }) as const,
        (error: unknown) => ({ ok: false, error }) as const,
      );

    if (!createResult.ok) {
      const message =
        createResult.error instanceof Error ? createResult.error.message : "Failed to create team";
      toast.error(message);
      return;
    }

    if (!createResult.value) {
      toast.error("Failed to create team");
      return;
    }

    const activateResult = await setActive
      .mutateAsync({
        organizationId: createResult.value.id,
      })
      .then(
        () => ({ ok: true }) as const,
        (error: unknown) => ({ ok: false, error }) as const,
      );

    if (!activateResult.ok) {
      const message =
        activateResult.error instanceof Error
          ? activateResult.error.message
          : "Failed to create team";
      toast.error(message);
      return;
    }

    toast.success("Team created");
    onOpenChange(false);
    setName("");
    setSlug("");
    router.push(`/org/${createResult.value.slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>
              Teams are workspaces where your people track and resolve issues together.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                placeholder="Backend"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                placeholder="backend"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used in URLs: /org/{slug || "..."}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

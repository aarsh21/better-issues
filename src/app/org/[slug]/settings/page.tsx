"use client";

import { api } from "@/convex";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Plus, Trash2, FileText, Users, Tag, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelBadge } from "@/components/issues/label-badge";
import { authClient } from "@/lib/auth-client";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#1e293b",
];

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();
  const { data: activeOrg } = authClient.useActiveOrganization();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href={`/org/${params.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <h1 className="text-sm font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Tabs defaultValue="labels">
            <TabsList>
              <TabsTrigger value="labels" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Labels
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="labels" className="mt-6">
              {activeOrg && <LabelsTab organizationId={activeOrg.id} />}
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              {activeOrg && <TemplatesTab organizationId={activeOrg.id} slug={params.slug} />}
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <MembersTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Labels Tab ──────────────────────────────────────────────

function LabelsTab({ organizationId }: { organizationId: string }) {
  const labels = useQuery(api.labels.list, { organizationId });
  const createLabel = useMutation(api.labels.create).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.labels.list, {
      organizationId: args.organizationId,
    });
    if (current !== undefined) {
      localStore.setQuery(api.labels.list, { organizationId: args.organizationId }, [
        ...current,
        {
          _id: crypto.randomUUID() as any,
          _creationTime: Date.now(),
          organizationId: args.organizationId,
          name: args.name,
          color: args.color,
          description: args.description,
        },
      ]);
    }
  });
  const removeLabel = useMutation(api.labels.remove).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.labels.list, { organizationId });
    if (current !== undefined) {
      localStore.setQuery(
        api.labels.list,
        { organizationId },
        current.filter((l) => l._id !== args.labelId),
      );
    }
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]!);
  const [newDescription, setNewDescription] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createLabel({
        organizationId,
        name: newName.trim(),
        color: newColor,
        description: newDescription.trim() || undefined,
      });
      toast.success("Label created");
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create label");
    }
  };

  const handleRemove = async (labelId: string) => {
    try {
      await removeLabel({ labelId: labelId as any });
      toast.success("Label removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove label");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Labels</h2>
          <p className="text-xs text-muted-foreground">
            Manage labels for categorizing issues. We recommend 5-8 labels.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="gap-1.5"
          disabled={labels && labels.length >= 15}
        >
          <Plus className="h-3.5 w-3.5" />
          New Label
        </Button>
      </div>

      {labels === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No labels yet. Create labels to categorize your issues.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {labels.map((label: { _id: any; name: string; color: string; description?: string }) => (
            <div key={label._id} className="flex items-center justify-between border px-3 py-2">
              <div className="flex items-center gap-3">
                <LabelBadge name={label.name} color={label.color} />
                {label.description && (
                  <span className="text-xs text-muted-foreground">{label.description}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(label._id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create label</DialogTitle>
            <DialogDescription>
              Use prefixed names like &quot;type: bug&quot; or &quot;priority: urgent&quot; for
              better organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                placeholder="type: bug"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="h-6 w-6 border-2 cursor-pointer transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? "var(--foreground)" : "transparent",
                      transform: newColor === color ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
              <div className="mt-1">
                <LabelBadge name={newName || "preview"} color={newColor} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Templates Tab ───────────────────────────────────────────

function TemplatesTab({ organizationId, slug }: { organizationId: string; slug: string }) {
  const templates = useQuery(api.templates.list, { organizationId });
  const removeTemplate = useMutation(api.templates.remove);

  const handleRemove = async (templateId: string) => {
    try {
      await removeTemplate({ templateId: templateId as any });
      toast.success("Template removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove template");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Issue Templates</h2>
          <p className="text-xs text-muted-foreground">
            Define structured templates with custom fields for issue reporting.
          </p>
        </div>
        <Link href={`/org/${slug}/settings/templates/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Template
          </Button>
        </Link>
      </div>

      {templates === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No templates yet. Templates help reporters provide structured information.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {templates.map((template: { _id: any; name: string; description: string }) => (
            <div key={template._id} className="flex items-center justify-between border px-3 py-3">
              <div>
                <p className="text-sm font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(template._id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────

function MembersTab() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [members, setMembers] = useState<
    Array<{
      id: string;
      role: string;
      user: { id: string; name: string; email: string; image?: string | null };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // Fetch members when org is active
  useEffect(() => {
    if (!activeOrg) return;
    authClient.organization
      .listMembers()
      .then(({ data }) => {
        if (data) setMembers(data.members as unknown as typeof members);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeOrg]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: "member",
      });
      if (error) {
        toast.error(error.message ?? "Failed to send invitation");
      } else {
        toast.success("Invitation sent");
        setInviteEmail("");
        setShowInvite(false);
      }
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from the team?`)) return;
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberEmail,
      });
      if (error) {
        toast.error(error.message ?? "Failed to remove member");
      } else {
        setMembers((prev) => prev.filter((m) => m.user.email !== memberEmail));
        toast.success("Member removed");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Members</h2>
          <p className="text-xs text-muted-foreground">
            Manage your team&apos;s members and invite new ones.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowInvite(true)} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between border px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-xs font-medium uppercase">
                  {member.user.name?.charAt(0) ?? member.user.email.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs border px-2 py-0.5 font-mono text-muted-foreground">
                  {member.role}
                </span>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user.email)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new member to the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email address</Label>
              <Input
                type="email"
                placeholder="team@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

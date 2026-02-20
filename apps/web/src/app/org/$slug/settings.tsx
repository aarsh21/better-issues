"use client";

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

import { useMutation } from "convex/react";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Clock,
  FileText,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useReducer, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex";
import { queryClient } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { Link } from "@/components/ui/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelBadge } from "@/components/issues/label-badge";
import {
  useActiveOrganization,
  useCancelInvitation,
  useInvitations,
  useInviteMember,
  useMembers,
  useRemoveMember,
} from "@/hooks/use-organization";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "@/lib/navigation";
import { prefetchOrgRouteData } from "@/lib/route-prefetch";
import { TEMPLATE_PRESETS } from "@/lib/template-presets";

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

type SettingsTab = "labels" | "templates" | "members";
const SETTINGS_TABS = new Set<SettingsTab>(["labels", "templates", "members"]);

export const Route = createFileRoute("/org/$slug/settings")({
  validateSearch: (search) => ({
    tab:
      typeof search.tab === "string" && SETTINGS_TABS.has(search.tab as SettingsTab)
        ? (search.tab as SettingsTab)
        : undefined,
  }),
  loader: ({ params }) => {
    void prefetchOrgRouteData(`/org/${encodeURIComponent(params.slug)}/settings`, queryClient);
  },
  component: SettingsPage,
});

export default function SettingsPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: activeOrg } = useActiveOrganization();
  const pathname = usePathname();
  const settingsPath = `/org/${params.slug}/settings`;
  const isSettingsIndex = pathname === settingsPath || pathname === `${settingsPath}/`;
  const activeTab = search.tab ?? "labels";

  if (!isSettingsIndex) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/org/${params.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <h1 className="text-sm font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              const nextTab = value as SettingsTab;
              void navigate({
                to: ".",
                search: (prev) => ({
                  ...prev,
                  tab: nextTab,
                }),
              });
            }}
          >
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
  const { data: labels } = useQuery(convexQuery(api.labels.list, { organizationId }));
  const createLabel = useMutation(api.labels.create).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.labels.list, {
      organizationId: args.organizationId,
    });
    if (current !== undefined) {
      localStore.setQuery(api.labels.list, { organizationId: args.organizationId }, [
        ...current,
        {
          _id: crypto.randomUUID() as any,
          _creationTime: current.length + 1,
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
    const result = await createLabel({
      organizationId,
      name: newName.trim(),
      color: newColor,
      description: newDescription.trim() || undefined,
    }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success("Label created");
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    } else {
      toast.error(result.error instanceof Error ? result.error.message : "Failed to create label");
    }
  };

  const handleRemove = async (labelId: string) => {
    const result = await removeLabel({ labelId: labelId as any }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success("Label removed");
    } else {
      toast.error(result.error instanceof Error ? result.error.message : "Failed to remove label");
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
        <div className="border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No labels yet. Create labels to categorize your issues.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {labels.map((label: { _id: any; name: string; color: string; description?: string }) => (
            <div
              key={label._id}
              className="flex items-center justify-between border border-border px-3 py-2"
            >
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
              <Label htmlFor="label-name">Name</Label>
              <Input
                id="label-name"
                placeholder="type: bug"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="label-color">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    aria-label={`Select ${color} label color`}
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
              <Label htmlFor="label-description">Description (optional)</Label>
              <Input
                id="label-description"
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
  const { data: templates } = useQuery(convexQuery(api.templates.list, { organizationId }));
  const removeTemplate = useMutation(api.templates.remove);
  const createTemplate = useMutation(api.templates.create);
  const [creatingPreset, setCreatingPreset] = useState<string | null>(null);

  const handleRemove = async (templateId: string) => {
    const result = await removeTemplate({ templateId: templateId as any }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success("Template removed");
    } else {
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to remove template",
      );
    }
  };

  const handleCreatePreset = async (preset: (typeof TEMPLATE_PRESETS)[number]) => {
    setCreatingPreset(preset.name);
    const result = await createTemplate({
      organizationId,
      name: preset.name,
      description: preset.description,
      schema: JSON.stringify(preset.schema),
    }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success(`${preset.name} template created`);
    } else {
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to create template",
      );
    }

    setCreatingPreset(null);
  };

  const templateNameSet = new Set(
    (templates ?? []).map((template) => template.name.trim().toLowerCase()),
  );

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
      ) : (
        <div className="space-y-6">
          {templates.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No templates yet. Templates help reporters provide structured information.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {templates.map((template: { _id: any; name: string; description: string }) => (
                <div
                  key={template._id}
                  className="flex items-center justify-between border border-border px-3 py-3"
                >
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

          <Separator />

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Starter templates</h3>
              <p className="text-xs text-muted-foreground">
                Start with a proven structure and customize later.
              </p>
            </div>
            <div className="grid gap-3">
              {TEMPLATE_PRESETS.map((preset) => {
                const presetExists = templateNameSet.has(preset.name.toLowerCase());
                return (
                  <div
                    key={preset.name}
                    className="flex flex-col gap-3 border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreatePreset(preset)}
                      disabled={creatingPreset !== null || presetExists}
                    >
                      {presetExists
                        ? "Already created"
                        : creatingPreset === preset.name
                          ? "Creating..."
                          : "Use template"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────

type MemberItem = NonNullable<ReturnType<typeof useMembers>["data"]>[number];
type InvitationItem = NonNullable<ReturnType<typeof useInvitations>["data"]>[number];

type MemberConfirmAction = {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
};

type MembersTabState = {
  inviteEmail: string;
  inviteRole: "member" | "admin";
  showInvite: boolean;
  copiedId: string | null;
  confirmAction: MemberConfirmAction | null;
};

type MembersTabAction =
  | { type: "setInviteEmail"; email: string }
  | { type: "setInviteRole"; role: "member" | "admin" }
  | { type: "setShowInvite"; show: boolean }
  | { type: "setCopiedId"; copiedId: string | null }
  | { type: "setConfirmAction"; confirmAction: MemberConfirmAction | null };

const INITIAL_MEMBERS_TAB_STATE: MembersTabState = {
  inviteEmail: "",
  inviteRole: "member",
  showInvite: false,
  copiedId: null,
  confirmAction: null,
};

function membersTabReducer(state: MembersTabState, action: MembersTabAction): MembersTabState {
  switch (action.type) {
    case "setInviteEmail": {
      return { ...state, inviteEmail: action.email };
    }
    case "setInviteRole": {
      return { ...state, inviteRole: action.role };
    }
    case "setShowInvite": {
      return { ...state, showInvite: action.show };
    }
    case "setCopiedId": {
      return { ...state, copiedId: action.copiedId };
    }
    case "setConfirmAction": {
      return { ...state, confirmAction: action.confirmAction };
    }
    default: {
      return state;
    }
  }
}

function MembersTab() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: session } = authClient.useSession();
  const { data: members, isPending: loading } = useMembers(activeOrg?.id);
  const { data: invitations, isPending: invitationsLoading } = useInvitations(activeOrg?.id);
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember(activeOrg?.id);
  const cancelInvitation = useCancelInvitation(activeOrg?.id);
  const [state, dispatch] = useReducer(membersTabReducer, INITIAL_MEMBERS_TAB_STATE);

  const currentUserId = session?.user?.id;
  const currentMember = (members ?? []).find((m) => m.user.id === currentUserId);
  const isAdmin = currentMember?.role === "admin" || currentMember?.role === "owner";
  const pendingInvitations = useMemo(
    () => (invitations ?? []).filter((invitation) => invitation.status === "pending"),
    [invitations],
  );

  const handleInvite = async () => {
    if (!state.inviteEmail.trim()) return;
    const result = await inviteMember
      .mutateAsync({
        email: state.inviteEmail.trim(),
        role: state.inviteRole,
      })
      .then(
        (value) => ({ ok: true, value }) as const,
        (error: unknown) => ({ ok: false, error }) as const,
      );

    if (!result.ok) {
      const message =
        result.error instanceof Error ? result.error.message : "Failed to send invitation";
      toast.error(message);
      return;
    }

    const invitationId =
      result.value?.id ??
      (result.value as Record<string, unknown> | null | undefined)?.invitationId;
    if (invitationId) {
      const link = `${window.location.origin}/invite/${invitationId}`;
      await navigator.clipboard.writeText(link);
      toast.success("Invitation created — link copied to clipboard");
    } else {
      toast.success("Invitation sent");
    }
    dispatch({ type: "setInviteEmail", email: "" });
    dispatch({ type: "setInviteRole", role: "member" });
    dispatch({ type: "setShowInvite", show: false });
  };

  const handleCopyLink = async (invitationId: string) => {
    const link = `${window.location.origin}/invite/${invitationId}`;
    await navigator.clipboard.writeText(link);
    dispatch({ type: "setCopiedId", copiedId: invitationId });
    toast.success("Invite link copied");
    setTimeout(() => dispatch({ type: "setCopiedId", copiedId: null }), 2_000);
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    dispatch({
      type: "setConfirmAction",
      confirmAction: {
        title: "Cancel invitation",
        description: `Cancel the invitation to ${email}?`,
        onConfirm: async () => {
          const result = await cancelInvitation.mutateAsync({ invitationId }).then(
            () => ({ ok: true }) as const,
            (error: unknown) => ({ ok: false, error }) as const,
          );

          if (result.ok) {
            toast.success("Invitation cancelled");
          } else {
            const message =
              result.error instanceof Error ? result.error.message : "Failed to cancel invitation";
            toast.error(message);
          }
        },
      },
    });
  };

  const handleRemoveMember = (memberEmail: string) => {
    dispatch({
      type: "setConfirmAction",
      confirmAction: {
        title: "Remove member",
        description: `Remove ${memberEmail} from the team?`,
        onConfirm: async () => {
          const result = await removeMember
            .mutateAsync({
              memberIdOrEmail: memberEmail,
            })
            .then(
              () => ({ ok: true }) as const,
              (error: unknown) => ({ ok: false, error }) as const,
            );

          if (result.ok) {
            toast.success("Member removed");
          } else {
            const message =
              result.error instanceof Error ? result.error.message : "Failed to remove member";
            toast.error(message);
          }
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <MembersSection
        loading={loading}
        members={members ?? []}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onInviteClick={() => dispatch({ type: "setShowInvite", show: true })}
        onRemoveMember={handleRemoveMember}
      />

      <Separator />
      <PendingInvitationsSection
        invitationsLoading={invitationsLoading}
        pendingInvitations={pendingInvitations}
        copiedId={state.copiedId}
        onCopyLink={handleCopyLink}
        onCancelInvitation={handleCancelInvitation}
      />

      <InviteMemberDialog
        open={state.showInvite}
        inviteEmail={state.inviteEmail}
        inviteRole={state.inviteRole}
        isSubmitting={inviteMember.isPending}
        onOpenChange={(show) => dispatch({ type: "setShowInvite", show })}
        onInvite={handleInvite}
        onEmailChange={(email) => dispatch({ type: "setInviteEmail", email })}
        onRoleChange={(role) => dispatch({ type: "setInviteRole", role })}
      />

      <ConfirmDialog
        open={state.confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "setConfirmAction", confirmAction: null });
          }
        }}
        title={state.confirmAction?.title ?? ""}
        description={state.confirmAction?.description ?? ""}
        confirmLabel="Confirm"
        variant="destructive"
        onConfirm={() => {
          void state.confirmAction?.onConfirm();
        }}
      />
    </div>
  );
}

function MembersSection({
  loading,
  members,
  isAdmin,
  currentUserId,
  onInviteClick,
  onRemoveMember,
}: {
  loading: boolean;
  members: MemberItem[];
  isAdmin: boolean;
  currentUserId: string | undefined;
  onInviteClick: () => void;
  onRemoveMember: (memberEmail: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Members</h2>
          <p className="text-xs text-muted-foreground">
            Manage your team&apos;s members and invite new ones.
          </p>
        </div>
        <Button size="sm" onClick={onInviteClick} className="gap-1.5" disabled={!isAdmin}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {["member-skeleton-1", "member-skeleton-2", "member-skeleton-3"].map((skeletonKey) => (
            <Skeleton key={skeletonKey} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between border border-border px-3 py-2"
            >
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
                <span className="text-xs border border-border px-2 py-0.5 font-mono text-muted-foreground">
                  {member.role}
                </span>
                {isAdmin && member.role !== "owner" && member.user.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMember(member.user.email)}
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
    </div>
  );
}

function PendingInvitationsSection({
  invitationsLoading,
  pendingInvitations,
  copiedId,
  onCopyLink,
  onCancelInvitation,
}: {
  invitationsLoading: boolean;
  pendingInvitations: InvitationItem[];
  copiedId: string | null;
  onCopyLink: (invitationId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string, email: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">Pending Invitations</h2>
        <p className="text-xs text-muted-foreground">
          Share the invite link with the person you&apos;re inviting.
        </p>
      </div>

      {invitationsLoading ? (
        <div className="space-y-2">
          {["invite-skeleton-1", "invite-skeleton-2"].map((skeletonKey) => (
            <Skeleton key={skeletonKey} className="h-12 w-full" />
          ))}
        </div>
      ) : pendingInvitations.length === 0 ? (
        <div className="border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between border border-border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-xs">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited as {invitation.role}
                    {invitation.expiresAt &&
                      ` · expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void onCopyLink(invitation.id);
                  }}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                >
                  {copiedId === invitation.id ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-3 w-3" />
                      Copy link
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelInvitation(invitation.id, invitation.email)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteMemberDialog({
  open,
  inviteEmail,
  inviteRole,
  isSubmitting,
  onOpenChange,
  onInvite,
  onEmailChange,
  onRoleChange,
}: {
  open: boolean;
  inviteEmail: string;
  inviteRole: "member" | "admin";
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: () => Promise<void>;
  onEmailChange: (email: string) => void;
  onRoleChange: (role: "member" | "admin") => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation and share the invite link with the person.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="team@example.com"
              value={inviteEmail}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={inviteRole}
              onValueChange={(value) => onRoleChange(value as "member" | "admin")}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void onInvite();
            }}
            disabled={isSubmitting || !inviteEmail.trim()}
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

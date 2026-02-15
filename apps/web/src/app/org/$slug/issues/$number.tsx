"use client";

import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { Id, TemplateField, TemplateSchema } from "@/convex";

import { useMutation } from "convex/react";
import { ArrowLeft, Clock, ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LabelBadge } from "@/components/issues/label-badge";
import { PriorityIndicator } from "@/components/issues/priority-indicator";
import { StatusBadge } from "@/components/issues/status-badge";
import { useActiveOrganization } from "@/hooks/use-organization";
import { formatDate, formatFileSize } from "@/lib/utils";

type IssueStatus = "open" | "in_progress" | "closed";
type IssuePriority = "low" | "medium" | "high" | "urgent";

export const Route = createFileRoute("/org/$slug/issues/$number")({
  component: IssueDetailPage,
});

type TemplateFileValue = {
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
};

const isTemplateFileValue = (candidate: unknown): candidate is TemplateFileValue => {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return false;
  }
  const record = candidate as {
    storageId?: unknown;
    fileName?: unknown;
    fileType?: unknown;
    fileSize?: unknown;
  };

  return (
    typeof record.storageId === "string" &&
    record.storageId.length > 0 &&
    typeof record.fileName === "string" &&
    record.fileName.length > 0 &&
    typeof record.fileType === "string" &&
    typeof record.fileSize === "number" &&
    Number.isFinite(record.fileSize)
  );
};

const normalizeFileValues = (value: unknown, allowMultiple: boolean) => {
  if (Array.isArray(value)) {
    const files = value.filter(isTemplateFileValue);
    return allowMultiple ? files : files.slice(0, 1);
  }

  if (isTemplateFileValue(value)) {
    return [value];
  }

  return [];
};

function TemplateFileList({
  field,
  value,
  organizationId,
}: {
  field: TemplateField;
  value: unknown;
  organizationId: string;
}) {
  const allowMultiple = field.multiple !== false;
  const files = normalizeFileValues(value, allowMultiple);
  const storageIds = files.map((file) => file.storageId);
  const { data: resolvedUrls } = useQuery(
    convexQuery(api.files.getUrls, storageIds.length > 0 ? { organizationId, storageIds } : "skip"),
  );

  if (files.length === 0) return null;

  const isLoadingUrls = resolvedUrls === undefined;
  const urlByStorageId = new Map((resolvedUrls ?? []).map((entry) => [entry.storageId, entry.url]));

  return (
    <div className="grid gap-2">
      {files.map((file) => {
        const url = urlByStorageId.get(file.storageId) ?? null;
        const isImage = file.fileType.startsWith("image/");

        return (
          <div
            key={file.storageId}
            className="flex flex-col gap-3 border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{file.fileName}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
              {isLoadingUrls ? (
                <span className="text-xs text-muted-foreground">Loading link...</span>
              ) : url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open file
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Link unavailable</span>
              )}
            </div>
            {url && isImage && (
              <img src={url} alt={file.fileName} className="h-20 w-20 border object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IssueDetailPage() {
  const params = Route.useParams();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();

  const issueNumber = parseInt(params.number, 10);

  const { data: issue } = useQuery(
    convexQuery(
      api.issues.getByNumber,
      activeOrg ? { organizationId: activeOrg.id, number: issueNumber } : "skip",
    ),
  );

  const { data: labels } = useQuery(
    convexQuery(api.labels.list, activeOrg ? { organizationId: activeOrg.id } : "skip"),
  );

  const { data: template } = useQuery(
    convexQuery(api.templates.get, issue?.templateId ? { templateId: issue.templateId } : "skip"),
  );

  const updateIssue = useMutation(api.issues.update).withOptimisticUpdate((localStore, args) => {
    if (!activeOrg) return;
    const current = localStore.getQuery(api.issues.getByNumber, {
      organizationId: activeOrg.id,
      number: issueNumber,
    });
    if (current !== undefined && current !== null) {
      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (args.title !== undefined) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.priority !== undefined) updates.priority = args.priority;
      if (args.labelIds !== undefined) updates.labelIds = args.labelIds;
      localStore.setQuery(
        api.issues.getByNumber,
        { organizationId: activeOrg.id, number: issueNumber },
        { ...current, ...updates },
      );
    }
  });
  const updateStatus = useMutation(api.issues.updateStatus).withOptimisticUpdate(
    (localStore, args) => {
      if (!activeOrg) return;
      const current = localStore.getQuery(api.issues.getByNumber, {
        organizationId: activeOrg.id,
        number: issueNumber,
      });
      if (current !== undefined && current !== null) {
        localStore.setQuery(
          api.issues.getByNumber,
          { organizationId: activeOrg.id, number: issueNumber },
          {
            ...current,
            status: args.status,
            updatedAt: Date.now(),
            closedAt:
              args.status === "closed"
                ? Date.now()
                : current.status === "closed"
                  ? undefined
                  : current.closedAt,
          },
        );
      }
    },
  );
  const removeIssue = useMutation(api.issues.remove);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!activeOrg || issue === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (issue === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-sm font-medium">Issue not found</p>
        <Link href={`/org/${params.slug}`}>
          <Button variant="ghost" size="sm" className="mt-2">
            Back to issues
          </Button>
        </Link>
      </div>
    );
  }

  const parsedTemplateData: Record<string, unknown> = issue.templateData
    ? (() => {
        try {
          return JSON.parse(issue.templateData) as Record<string, unknown>;
        } catch {
          return {};
        }
      })()
    : {};

  const parsedSchema: TemplateSchema | null = template
    ? (() => {
        try {
          return JSON.parse(template.schema) as TemplateSchema;
        } catch {
          return null;
        }
      })()
    : null;

  const handleStartEdit = () => {
    setEditTitle(issue.title);
    setEditDescription(issue.description ?? "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateIssue({
        issueId: issue._id,
        title: editTitle,
        description: editDescription || undefined,
      });
      setEditing(false);
      toast.success("Issue updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const handleStatusChange = async (status: IssueStatus) => {
    try {
      await updateStatus({ issueId: issue._id, status });
      toast.success(`Status changed to ${status.replace("_", " ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handlePriorityChange = async (priority: IssuePriority) => {
    try {
      await updateIssue({ issueId: issue._id, priority });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update priority");
    }
  };

  const handleLabelToggle = async (labelId: Id<"labels">) => {
    const newLabels = issue.labelIds.includes(labelId)
      ? issue.labelIds.filter((id: Id<"labels">) => id !== labelId)
      : [...issue.labelIds, labelId];

    try {
      await updateIssue({ issueId: issue._id, labelIds: newLabels });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update labels");
    }
  };

  const handleDelete = async () => {
    try {
      await removeIssue({ issueId: issue._id });
      toast.success("Issue deleted");
      router.push(`/org/${params.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/org/${params.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground font-mono">#{issue.number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleStartEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_220px]">
            {/* Main content */}
            <div className="space-y-6">
              {editing ? (
                <div className="space-y-4">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-bold"
                    autoFocus
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={6}
                    placeholder="Description..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-lg font-bold">{issue.title}</h1>
                  {issue.description && (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                      {issue.description}
                    </p>
                  )}
                </div>
              )}

              {/* Template data */}
              {parsedSchema && Object.keys(parsedTemplateData).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {template?.name ?? "Template Data"}
                    </p>
                    {parsedSchema.fields.map((field) => {
                      const value = parsedTemplateData[field.key];
                      const isEmptyValue =
                        value === undefined ||
                        value === null ||
                        value === "" ||
                        (Array.isArray(value) && value.length === 0);
                      if (isEmptyValue) return null;
                      if (field.type === "file") {
                        return (
                          <div key={field.key} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {field.label}
                            </p>
                            <TemplateFileList
                              field={field}
                              value={value}
                              organizationId={activeOrg!.id}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={field.key} className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                          <p className="text-sm whitespace-pre-wrap">
                            {field.type === "checkbox" ? (value ? "Yes" : "No") : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </Label>
                <Select
                  value={issue.status}
                  onValueChange={(v) => handleStatusChange(v as IssueStatus)}
                >
                  <SelectTrigger className="h-8">
                    <StatusBadge status={issue.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Priority
                </Label>
                <Select
                  value={issue.priority}
                  onValueChange={(v) => handlePriorityChange(v as IssuePriority)}
                >
                  <SelectTrigger className="h-8">
                    <PriorityIndicator priority={issue.priority} showLabel />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Labels
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {labels && labels.length > 0 ? (
                    labels.map((label: { _id: Id<"labels">; name: string; color: string }) => (
                      <button
                        key={label._id}
                        onClick={() => handleLabelToggle(label._id)}
                        className="cursor-pointer transition-opacity"
                        style={{
                          opacity: issue.labelIds.includes(label._id) ? 1 : 0.4,
                        }}
                      >
                        <LabelBadge name={label.name} color={label.color} />
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No labels configured</span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Created {formatDate(issue.createdAt)}
                </div>
                {issue.updatedAt !== issue.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Updated {formatDate(issue.updatedAt)}
                  </div>
                )}
                {issue.closedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Closed {formatDate(issue.closedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete issue"
        description="Are you sure you want to delete this issue? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

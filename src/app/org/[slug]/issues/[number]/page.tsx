"use client";

import type { TemplateSchema, Id } from "@/convex";

import { api } from "@/convex";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Pencil, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityIndicator } from "@/components/issues/priority-indicator";
import { LabelBadge } from "@/components/issues/label-badge";
import { authClient } from "@/lib/auth-client";

type IssueStatus = "open" | "in_progress" | "closed";
type IssuePriority = "low" | "medium" | "high" | "urgent";

export default function IssueDetailPage() {
  const params = useParams<{ slug: string; number: string }>();
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const issueNumber = parseInt(params.number, 10);

  const issue = useQuery(
    api.issues.getByNumber,
    activeOrg ? { organizationId: activeOrg.id, number: issueNumber } : "skip",
  );

  const labels = useQuery(api.labels.list, activeOrg ? { organizationId: activeOrg.id } : "skip");

  const template = useQuery(
    api.templates.get,
    issue?.templateId ? { templateId: issue.templateId } : "skip",
  );

  const updateIssue = useMutation(api.issues.update);
  const updateStatus = useMutation(api.issues.updateStatus);
  const removeIssue = useMutation(api.issues.remove);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      await removeIssue({ issueId: issue._id });
      toast.success("Issue deleted");
      router.push(`/org/${params.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
            onClick={handleDelete}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="grid grid-cols-[1fr_220px] gap-8">
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
                      if (value === undefined || value === null || value === "") return null;
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
    </div>
  );
}

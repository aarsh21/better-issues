"use client";

import type { Doc, Id, TemplateSchema } from "@/convex";

import { api } from "@/convex";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateFieldRenderer } from "@/components/issues/template-fields";
import { authClient } from "@/lib/auth-client";

type IssuePriority = "low" | "medium" | "high" | "urgent";

export default function NewIssuePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const templates = useQuery(
    api.templates.list,
    activeOrg ? { organizationId: activeOrg.id } : "skip",
  );
  const labels = useQuery(api.labels.list, activeOrg ? { organizationId: activeOrg.id } : "skip");

  const createIssue = useMutation(api.issues.create);

  const [step, setStep] = useState<"choose-template" | "form">("choose-template");
  const [selectedTemplate, setSelectedTemplate] = useState<Doc<"issueTemplates"> | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  const [templateData, setTemplateData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const parsedSchema: TemplateSchema | null = selectedTemplate
    ? (() => {
        try {
          return JSON.parse(selectedTemplate.schema) as TemplateSchema;
        } catch {
          return null;
        }
      })()
    : null;

  const handleTemplateSelect = (template: Doc<"issueTemplates"> | null) => {
    setSelectedTemplate(template);
    setTemplateData({});
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !title.trim()) return;

    setSubmitting(true);
    try {
      const result = await createIssue({
        organizationId: activeOrg.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        labelIds: selectedLabels,
        templateId: selectedTemplate?._id,
        templateData:
          Object.keys(templateData).length > 0 ? JSON.stringify(templateData) : undefined,
      });

      toast.success(`Issue #${result.number} created`);
      router.push(`/org/${params.slug}/issues/${result.number}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create issue");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (labelId: Id<"labels">) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  if (!activeOrg) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Step 1: Choose template (per article best practice 3)
  if (step === "choose-template") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Link href={`/org/${params.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <h1 className="text-sm font-bold">New Issue</h1>
        </div>

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-lg space-y-4">
            <div>
              <h2 className="text-base font-medium">Choose a template</h2>
              <p className="text-sm text-muted-foreground">
                Select a template for structured reporting, or start blank.
              </p>
            </div>

            <div className="flex items-center gap-2 border px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Tip: Search existing issues before creating a new one (Cmd+K)</span>
            </div>

            <button
              onClick={() => handleTemplateSelect(null)}
              className="flex w-full items-center gap-3 border p-4 text-left transition-colors hover:bg-accent cursor-pointer"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Blank issue</p>
                <p className="text-xs text-muted-foreground">
                  Start from scratch with title and description
                </p>
              </div>
            </button>

            {templates === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              templates.map((template: Doc<"issueTemplates">) => (
                <button
                  key={template._id}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex w-full items-center gap-3 border p-4 text-left transition-colors hover:bg-accent cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Issue form
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => setStep("choose-template")}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <h1 className="text-sm font-bold">
          New Issue
          {selectedTemplate && (
            <span className="ml-2 font-normal text-muted-foreground">
              / {selectedTemplate.name}
            </span>
          )}
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
          {/* Core fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Labels</Label>
                <div className="flex flex-wrap gap-1.5 min-h-9 items-center border px-3 py-1.5">
                  {labels && labels.length > 0 ? (
                    labels.map((label: { _id: Id<"labels">; name: string; color: string }) => (
                      <button
                        key={label._id}
                        type="button"
                        onClick={() => toggleLabel(label._id)}
                        className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs cursor-pointer transition-colors"
                        style={{
                          borderColor: selectedLabels.includes(label._id) ? label.color : undefined,
                          backgroundColor: selectedLabels.includes(label._id)
                            ? `${label.color}20`
                            : undefined,
                          color: selectedLabels.includes(label._id) ? label.color : undefined,
                        }}
                      >
                        <span className="h-2 w-2" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No labels</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Template fields */}
          {parsedSchema && parsedSchema.fields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Template Fields
                </p>
                {parsedSchema.fields.map((field) => (
                  <TemplateFieldRenderer
                    key={field.key}
                    field={field}
                    value={templateData[field.key]}
                    onChange={(value) =>
                      setTemplateData((prev) => ({
                        ...prev,
                        [field.key]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting || !title.trim()} className="flex-1">
              {submitting ? "Creating..." : "Create Issue"}
            </Button>
            <Link href={`/org/${params.slug}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

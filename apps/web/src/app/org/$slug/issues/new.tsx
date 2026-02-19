"use client";

import type { Doc, Id, TemplateSchema } from "@/convex";

import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { useMemo, useReducer } from "react";
import { toast } from "sonner";

import { api } from "@/convex";
import { TemplateFieldRenderer } from "@/components/issues/template-fields";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useRouter } from "@/lib/navigation";

type IssuePriority = "low" | "medium" | "high" | "urgent";
type IssueStep = "choose-template" | "form";

type IssueTemplate = Doc<"issueTemplates">;
type IssueLabel = { _id: Id<"labels">; name: string; color: string };

type NewIssueState = {
  step: IssueStep;
  selectedTemplateId: Id<"issueTemplates"> | null;
  title: string;
  description: string;
  priority: IssuePriority;
  selectedLabels: Id<"labels">[];
  templateData: Record<string, unknown>;
  submitting: boolean;
};

type NewIssueAction =
  | { type: "setStep"; step: IssueStep }
  | { type: "selectTemplate"; templateId: Id<"issueTemplates"> | null }
  | { type: "setTitle"; title: string }
  | { type: "setDescription"; description: string }
  | { type: "setPriority"; priority: IssuePriority }
  | { type: "toggleLabel"; labelId: Id<"labels"> }
  | { type: "setTemplateField"; key: string; value: unknown }
  | { type: "setSubmitting"; submitting: boolean };

const INITIAL_NEW_ISSUE_STATE: NewIssueState = {
  step: "choose-template",
  selectedTemplateId: null,
  title: "",
  description: "",
  priority: "medium",
  selectedLabels: [],
  templateData: {},
  submitting: false,
};

function newIssueReducer(state: NewIssueState, action: NewIssueAction): NewIssueState {
  switch (action.type) {
    case "setStep": {
      return { ...state, step: action.step };
    }
    case "selectTemplate": {
      return {
        ...state,
        selectedTemplateId: action.templateId,
        templateData: {},
      };
    }
    case "setTitle": {
      return { ...state, title: action.title };
    }
    case "setDescription": {
      return { ...state, description: action.description };
    }
    case "setPriority": {
      return { ...state, priority: action.priority };
    }
    case "toggleLabel": {
      return {
        ...state,
        selectedLabels: state.selectedLabels.includes(action.labelId)
          ? state.selectedLabels.filter((id) => id !== action.labelId)
          : [...state.selectedLabels, action.labelId],
      };
    }
    case "setTemplateField": {
      return {
        ...state,
        templateData: {
          ...state.templateData,
          [action.key]: action.value,
        },
      };
    }
    case "setSubmitting": {
      return { ...state, submitting: action.submitting };
    }
    default: {
      return state;
    }
  }
}

export const Route = createFileRoute("/org/$slug/issues/new")({
  validateSearch: (search) => ({
    template: typeof search.template === "string" ? search.template : undefined,
    templates: typeof search.templates === "string" ? search.templates : undefined,
  }),
  component: NewIssuePage,
});

export default function NewIssuePage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const [state, dispatch] = useReducer(newIssueReducer, INITIAL_NEW_ISSUE_STATE);

  const { data: templates } = useQuery(
    convexQuery(api.templates.list, activeOrg ? { organizationId: activeOrg.id } : "skip"),
  );
  const { data: labels } = useQuery(
    convexQuery(api.labels.list, activeOrg ? { organizationId: activeOrg.id } : "skip"),
  );

  const createIssue = useMutation(api.issues.create);

  const templateFromSearchId = search.template ?? search.templates;

  const selectedTemplateFromSearch = useMemo<IssueTemplate | null | undefined>(() => {
    if (!templateFromSearchId) {
      return undefined;
    }
    if (templateFromSearchId === "blank") {
      return null;
    }
    if (!templates) {
      return undefined;
    }
    return templates.find((template) => template._id === templateFromSearchId);
  }, [templateFromSearchId, templates]);

  const selectedTemplate =
    selectedTemplateFromSearch !== undefined
      ? selectedTemplateFromSearch
      : ((templates ?? []).find((template) => template._id === state.selectedTemplateId) ?? null);

  const step = selectedTemplateFromSearch !== undefined ? "form" : state.step;

  const parsedSchema = useMemo<TemplateSchema | null>(() => {
    if (!selectedTemplate) {
      return null;
    }
    return JSON.parse(selectedTemplate.schema) as TemplateSchema;
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: IssueTemplate | null) => {
    dispatch({ type: "selectTemplate", templateId: template?._id ?? null });
    dispatch({ type: "setStep", step: "form" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeOrg || !state.title.trim()) {
      return;
    }

    dispatch({ type: "setSubmitting", submitting: true });

    const result = await createIssue({
      organizationId: activeOrg.id,
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      priority: state.priority,
      labelIds: state.selectedLabels,
      templateId: selectedTemplate?._id,
      templateData:
        Object.keys(state.templateData).length > 0 ? JSON.stringify(state.templateData) : undefined,
    }).then(
      (value) => ({ ok: true, value }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success(`Issue #${result.value.number} created`);
      router.push(`/org/${params.slug}/issues/${result.value.number}`);
    } else {
      toast.error(result.error instanceof Error ? result.error.message : "Failed to create issue");
      dispatch({ type: "setSubmitting", submitting: false });
    }
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

  if (step === "choose-template") {
    return (
      <TemplateSelectionStep
        slug={params.slug}
        templates={templates}
        onTemplateSelect={handleTemplateSelect}
      />
    );
  }

  return (
    <IssueFormStep
      slug={params.slug}
      labels={labels}
      organizationId={activeOrg.id}
      parsedSchema={parsedSchema}
      selectedLabels={state.selectedLabels}
      selectedTemplate={selectedTemplate}
      title={state.title}
      description={state.description}
      priority={state.priority}
      templateData={state.templateData}
      submitting={state.submitting}
      onBack={() => {
        dispatch({ type: "setStep", step: "choose-template" });
        router.replace(`/org/${params.slug}/issues/new`);
      }}
      onSubmit={handleSubmit}
      onTitleChange={(title) => dispatch({ type: "setTitle", title })}
      onDescriptionChange={(description) => dispatch({ type: "setDescription", description })}
      onPriorityChange={(priority) => dispatch({ type: "setPriority", priority })}
      onToggleLabel={(labelId) => dispatch({ type: "toggleLabel", labelId })}
      onTemplateDataChange={(key, value) => dispatch({ type: "setTemplateField", key, value })}
    />
  );
}

function TemplateSelectionStep({
  slug,
  templates,
  onTemplateSelect,
}: {
  slug: string;
  templates: IssueTemplate[] | undefined;
  onTemplateSelect: (template: IssueTemplate | null) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/org/${slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <h1 className="text-sm font-bold">New Issue</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="mx-auto max-w-lg space-y-4">
          <div>
            <h2 className="text-base font-medium">Choose a template</h2>
            <p className="text-sm text-muted-foreground">
              Select a template for structured reporting, or start blank.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Tip: Search existing issues before creating a new one (Cmd+K)</span>
          </div>

          <button
            type="button"
            onClick={() => onTemplateSelect(null)}
            className="flex w-full items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-accent cursor-pointer"
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
            templates.map((template) => (
              <button
                key={template._id}
                type="button"
                onClick={() => onTemplateSelect(template)}
                className="flex w-full items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-accent cursor-pointer"
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

function IssueFormStep({
  slug,
  labels,
  organizationId,
  parsedSchema,
  selectedLabels,
  selectedTemplate,
  title,
  description,
  priority,
  templateData,
  submitting,
  onBack,
  onSubmit,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onToggleLabel,
  onTemplateDataChange,
}: {
  slug: string;
  labels: IssueLabel[] | undefined;
  organizationId: string;
  parsedSchema: TemplateSchema | null;
  selectedLabels: Id<"labels">[];
  selectedTemplate: IssueTemplate | null;
  title: string;
  description: string;
  priority: IssuePriority;
  templateData: Record<string, unknown>;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPriorityChange: (priority: IssuePriority) => void;
  onToggleLabel: (labelId: Id<"labels">) => void;
  onTemplateDataChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
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
        <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details..."
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issue-priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => onPriorityChange(value as IssuePriority)}
                >
                  <SelectTrigger id="issue-priority">
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
                <div className="flex flex-wrap gap-1.5 min-h-9 items-center border border-border px-3 py-1.5">
                  {labels && labels.length > 0 ? (
                    labels.map((label) => {
                      const isSelected = selectedLabels.includes(label._id);

                      return (
                        <button
                          key={label._id}
                          type="button"
                          onClick={() => onToggleLabel(label._id)}
                          className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs cursor-pointer transition-colors"
                          style={{
                            borderColor: isSelected ? label.color : undefined,
                            backgroundColor: isSelected ? `${label.color}20` : undefined,
                            color: isSelected ? label.color : undefined,
                          }}
                        >
                          <span className="h-2 w-2" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">No labels</span>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                    organizationId={organizationId}
                    onChange={(value) => onTemplateDataChange(field.key, value)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting || !title.trim()} className="flex-1">
              {submitting ? "Creating..." : "Create Issue"}
            </Button>
            <Link href={`/org/${slug}`}>
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

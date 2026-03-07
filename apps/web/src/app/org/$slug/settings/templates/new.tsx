"use client";

import type { TemplateField, TemplateSchema } from "@/lib/api-contracts";

import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMemo, useReducer } from "react";
import { toast } from "sonner";

import { TEMPLATE_FIELD_TYPES, templateSchemaValidator } from "@better-issues/api-client";

import { TemplateFieldRenderer } from "@/components/issues/template-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useRouter } from "@/lib/navigation";
import { apiClient } from "@better-issues/api-client";
import { unwrapResponse } from "@/lib/api";

type TemplateFieldDraft = TemplateField & { id: string };

type TemplateState = {
  name: string;
  description: string;
  fields: TemplateFieldDraft[];
  submitting: boolean;
  showPreview: boolean;
};

type TemplateAction =
  | { type: "setName"; name: string }
  | { type: "setDescription"; description: string }
  | { type: "togglePreview" }
  | { type: "setSubmitting"; submitting: boolean }
  | { type: "addField" }
  | { type: "removeField"; index: number }
  | { type: "updateField"; index: number; updates: Partial<TemplateFieldDraft> };

const createEmptyField = (): TemplateFieldDraft => ({
  id: crypto.randomUUID(),
  key: "",
  label: "",
  type: "text",
  required: false,
});

const INITIAL_TEMPLATE_STATE: TemplateState = {
  name: "",
  description: "",
  fields: [createEmptyField()],
  submitting: false,
  showPreview: false,
};

function templateReducer(state: TemplateState, action: TemplateAction): TemplateState {
  switch (action.type) {
    case "setName":
      return { ...state, name: action.name };
    case "setDescription":
      return { ...state, description: action.description };
    case "togglePreview":
      return { ...state, showPreview: !state.showPreview };
    case "setSubmitting":
      return { ...state, submitting: action.submitting };
    case "addField":
      return { ...state, fields: [...state.fields, createEmptyField()] };
    case "removeField":
      return { ...state, fields: state.fields.filter((_, index) => index !== action.index) };
    case "updateField":
      return {
        ...state,
        fields: state.fields.map((field, index) =>
          index === action.index ? { ...field, ...action.updates } : field,
        ),
      };
    default:
      return state;
  }
}

export const Route = createFileRoute("/org/$slug/settings/templates/new")({
  component: NewTemplatePage,
});

function NewTemplatePage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { data: activeOrganization } = useActiveOrganization();
  const [state, dispatch] = useReducer(templateReducer, INITIAL_TEMPLATE_STATE);

  const previewSchema = useMemo<TemplateSchema>(
    () => ({
      fields: state.fields
        .filter((field) => field.key && field.label)
        .map(({ id: _id, ...field }) => field),
    }),
    [state.fields],
  );

  const handleSubmit = async () => {
    if (!activeOrganization) {
      return;
    }

    const validFields = state.fields.filter((field) => field.key.trim() && field.label.trim());
    const validation = templateSchemaValidator.safeParse({
      fields: validFields.map(({ id: _id, ...field }) => field),
    });

    if (!state.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Template schema is invalid");
      return;
    }

    dispatch({ type: "setSubmitting", submitting: true });

    const result = await unwrapResponse(
      apiClient.api.v1.templates.post({
        organizationId: activeOrganization.id,
        name: state.name.trim(),
        description: state.description.trim(),
        schema: JSON.stringify(validation.data),
      }),
    ).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (!result.ok) {
      dispatch({ type: "setSubmitting", submitting: false });
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to create template",
      );
      return;
    }

    toast.success("Template created");
    router.push(`/org/${slug}/settings?tab=templates`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/org/${slug}/settings?tab=templates`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <h1 className="text-sm font-bold">New Template</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: "togglePreview" })}>
          {state.showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {state.showPreview ? (
          <TemplatePreviewPanel
            name={state.name}
            description={state.description}
            previewSchema={previewSchema}
          />
        ) : (
          <TemplateEditorForm
            name={state.name}
            description={state.description}
            fields={state.fields}
            submitting={state.submitting}
            onSubmit={handleSubmit}
            onNameChange={(name) => dispatch({ type: "setName", name })}
            onDescriptionChange={(description) => dispatch({ type: "setDescription", description })}
            onAddField={() => dispatch({ type: "addField" })}
            onRemoveField={(index) => dispatch({ type: "removeField", index })}
            onUpdateField={(index, updates) => dispatch({ type: "updateField", index, updates })}
          />
        )}
      </div>
    </div>
  );
}

function TemplatePreviewPanel({
  name,
  description,
  previewSchema,
}: {
  name: string;
  description: string;
  previewSchema: TemplateSchema;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-base font-medium">Preview: {name || "Untitled"}</h2>
        <p className="text-sm text-muted-foreground">{description || "No description"}</p>
      </div>
      <Separator />
      {previewSchema.fields.length > 0 ? (
        <div className="space-y-4">
          {previewSchema.fields.map((field) => (
            <TemplateFieldRenderer
              key={field.key}
              field={field}
              value={undefined}
              onChange={() => {}}
              readOnly
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No valid fields to preview. Add fields with key and label.
        </p>
      )}
    </div>
  );
}

function TemplateEditorForm({
  name,
  description,
  fields,
  submitting,
  onSubmit,
  onNameChange,
  onDescriptionChange,
  onAddField,
  onRemoveField,
  onUpdateField,
}: {
  name: string;
  description: string;
  fields: TemplateFieldDraft[];
  submitting: boolean;
  onSubmit: () => Promise<void>;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onUpdateField: (index: number, updates: Partial<TemplateFieldDraft>) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="template-name">Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Bug report"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="template-description">Description</Label>
          <Textarea
            id="template-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Collect the right details before triage."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Field {index + 1}</h3>
              {fields.length > 1 ? (
                <Button variant="ghost" size="icon-sm" onClick={() => onRemoveField(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Key</Label>
                <Input
                  value={field.key}
                  placeholder="stepsToReproduce"
                  onChange={(event) => onUpdateField(index, { key: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Label</Label>
                <Input
                  value={field.label}
                  placeholder="Steps to reproduce"
                  onChange={(event) => onUpdateField(index, { label: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    onUpdateField(index, { type: value as TemplateField["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_FIELD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder ?? ""}
                  placeholder="Optional helper text"
                  onChange={(event) => onUpdateField(index, { placeholder: event.target.value })}
                />
              </div>
            </div>

            {field.type === "select" ? (
              <div className="grid gap-2">
                <Label>Options</Label>
                <Textarea
                  value={(field.options ?? []).join("\n")}
                  placeholder={"High\nMedium\nLow"}
                  onChange={(event) =>
                    onUpdateField(index, {
                      options: event.target.value
                        .split("\n")
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            ) : null}

            {field.type === "file" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Accepted types</Label>
                  <Input
                    value={field.accept ?? ""}
                    placeholder="image/*,.pdf"
                    onChange={(event) => onUpdateField(index, { accept: event.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Checkbox
                    id={`field-multiple-${field.id}`}
                    checked={field.multiple !== false}
                    onCheckedChange={(checked) =>
                      onUpdateField(index, { multiple: Boolean(checked) })
                    }
                  />
                  <Label htmlFor={`field-multiple-${field.id}`}>Allow multiple files</Label>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox
                id={`field-required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => onUpdateField(index, { required: Boolean(checked) })}
              />
              <Label htmlFor={`field-required-${field.id}`}>Required field</Label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onAddField}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
        <Button
          disabled={submitting}
          onClick={() => {
            void onSubmit();
          }}
        >
          {submitting ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </div>
  );
}

export default NewTemplatePage;

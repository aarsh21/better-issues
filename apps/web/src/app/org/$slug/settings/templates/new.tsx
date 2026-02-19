"use client";

import type { TemplateField, TemplateSchema } from "@/convex";

import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useReducer } from "react";
import { toast } from "sonner";

import { TEMPLATE_FIELD_TYPES, api } from "@/convex";
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
import { useActiveOrganization } from "@/hooks/use-organization";
import { useRouter } from "@/lib/navigation";

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
    case "setName": {
      return { ...state, name: action.name };
    }
    case "setDescription": {
      return { ...state, description: action.description };
    }
    case "togglePreview": {
      return { ...state, showPreview: !state.showPreview };
    }
    case "setSubmitting": {
      return { ...state, submitting: action.submitting };
    }
    case "addField": {
      return { ...state, fields: [...state.fields, createEmptyField()] };
    }
    case "removeField": {
      return {
        ...state,
        fields: state.fields.filter((_, index) => index !== action.index),
      };
    }
    case "updateField": {
      return {
        ...state,
        fields: state.fields.map((field, index) =>
          index === action.index ? { ...field, ...action.updates } : field,
        ),
      };
    }
    default: {
      return state;
    }
  }
}

export const Route = createFileRoute("/org/$slug/settings/templates/new")({
  component: NewTemplatePage,
});

export default function NewTemplatePage() {
  const params = Route.useParams();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const createTemplate = useMutation(api.templates.create);
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
    if (!activeOrg || !state.name.trim() || state.fields.length === 0) {
      return;
    }

    const validFields = state.fields.filter((field) => field.key && field.label);
    if (validFields.length === 0) {
      toast.error("Add at least one valid field with key and label");
      return;
    }

    const schema: TemplateSchema = {
      fields: validFields.map(({ id: _id, ...field }) => field),
    };

    dispatch({ type: "setSubmitting", submitting: true });
    const result = await createTemplate({
      organizationId: activeOrg.id,
      name: state.name.trim(),
      description: state.description.trim(),
      schema: JSON.stringify(schema),
    }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success("Template created");
      router.push(`/org/${params.slug}/settings`);
      return;
    }

    dispatch({ type: "setSubmitting", submitting: false });
    toast.error(result.error instanceof Error ? result.error.message : "Failed to create template");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/org/${params.slug}/settings`}>
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
            slug={params.slug}
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
  slug,
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
  slug: string;
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
  const jsonPreview = useMemo(
    () => JSON.stringify({ fields: fields.filter((field) => field.key && field.label) }, null, 2),
    [fields],
  );

  return (
    <form
      action={async () => {
        await onSubmit();
      }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="template-name">
            Template Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="template-name"
            placeholder="Bug Report"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="template-description">Description</Label>
          <Input
            id="template-description"
            placeholder="Standard template for reporting bugs"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fields</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddField}
            className="gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Field
          </Button>
        </div>

        {fields.map((field, index) => (
          <TemplateFieldEditorCard
            key={field.id}
            field={field}
            index={index}
            disableRemove={fields.length <= 1}
            onRemove={() => onRemoveField(index)}
            onUpdate={(updates) => onUpdateField(index, updates)}
          />
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          JSON Schema
        </Label>
        <pre className="overflow-auto border border-border bg-muted p-3 text-xs font-mono">
          {jsonPreview}
        </pre>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting || !name.trim() || fields.length === 0}
          className="flex-1"
        >
          {submitting ? "Creating..." : "Create Template"}
        </Button>
        <Link href={`/org/${slug}/settings`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

function TemplateFieldEditorCard({
  field,
  index,
  disableRemove,
  onRemove,
  onUpdate,
}: {
  field: TemplateFieldDraft;
  index: number;
  disableRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<TemplateFieldDraft>) => void;
}) {
  return (
    <div className="space-y-3 border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">Field {index + 1}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          disabled={disableRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`field-key-${field.id}`} className="text-xs">
            Key (camelCase)
          </Label>
          <Input
            id={`field-key-${field.id}`}
            placeholder="stepsToReproduce"
            value={field.key}
            onChange={(event) => onUpdate({ key: event.target.value })}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`field-label-${field.id}`} className="text-xs">
            Label
          </Label>
          <Input
            id={`field-label-${field.id}`}
            placeholder="Steps to Reproduce"
            value={field.label}
            onChange={(event) => onUpdate({ label: event.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`field-type-${field.id}`} className="text-xs">
            Type
          </Label>
          <Select
            value={field.type}
            onValueChange={(value) => onUpdate({ type: value as TemplateField["type"] })}
          >
            <SelectTrigger id={`field-type-${field.id}`} className="h-8 text-sm">
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
        <div className="flex items-end gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked === true })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
              Required
            </Label>
          </div>
        </div>
      </div>

      {field.type === "select" && (
        <div className="grid gap-1.5">
          <Label htmlFor={`options-${field.id}`} className="text-xs">
            Options (comma-separated)
          </Label>
          <Input
            id={`options-${field.id}`}
            placeholder="critical, major, minor, cosmetic"
            value={field.options?.join(", ") ?? ""}
            onChange={(event) =>
              onUpdate({
                options: event.target.value
                  .split(",")
                  .map((option) => option.trim())
                  .filter(Boolean),
              })
            }
            className="h-8 text-sm"
          />
        </div>
      )}

      {field.type === "file" && (
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`multiple-${field.id}`}
              checked={field.multiple !== false}
              onCheckedChange={(checked) => onUpdate({ multiple: checked === true })}
            />
            <Label htmlFor={`multiple-${field.id}`} className="text-xs cursor-pointer">
              Allow multiple files
            </Label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`accept-${field.id}`} className="text-xs">
              Accepted file types (optional)
            </Label>
            <Input
              id={`accept-${field.id}`}
              placeholder="image/*,.pdf"
              value={field.accept ?? ""}
              onChange={(event) => onUpdate({ accept: event.target.value || undefined })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {field.type !== "file" && (
        <div className="grid gap-1.5">
          <Label htmlFor={`placeholder-${field.id}`} className="text-xs">
            Placeholder (optional)
          </Label>
          <Input
            id={`placeholder-${field.id}`}
            placeholder="Enter placeholder text..."
            value={field.placeholder ?? ""}
            onChange={(event) => onUpdate({ placeholder: event.target.value || undefined })}
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}

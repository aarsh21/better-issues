"use client";

import { createFileRoute } from "@tanstack/react-router";
import type { TemplateField, TemplateSchema } from "@/convex";

import { useMutation } from "convex/react";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TEMPLATE_FIELD_TYPES, api } from "@/convex";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateFieldRenderer } from "@/components/issues/template-fields";
import { useActiveOrganization } from "@/hooks/use-organization";

type TemplateFieldDraft = TemplateField & { id: string };

const createEmptyField = (): TemplateFieldDraft => ({
  id: crypto.randomUUID(),
  key: "",
  label: "",
  type: "text",
  required: false,
});

export const Route = createFileRoute("/org/$slug/settings/templates/new")({
  component: NewTemplatePage,
});

export default function NewTemplatePage() {
  const params = Route.useParams();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const createTemplate = useMutation(api.templates.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateFieldDraft[]>([createEmptyField()]);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateField = (index: number, updates: Partial<TemplateFieldDraft>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const addField = () => {
    setFields((prev) => [...prev, createEmptyField()]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !name.trim() || fields.length === 0) return;

    // Validate fields
    const validFields = fields.filter((f) => f.key && f.label);
    if (validFields.length === 0) {
      toast.error("Add at least one valid field with key and label");
      return;
    }

    const schema: TemplateSchema = {
      fields: validFields.map(({ id, ...field }) => field),
    };

    setSubmitting(true);
    const result = await createTemplate({
      organizationId: activeOrg.id,
      name: name.trim(),
      description: description.trim(),
      schema: JSON.stringify(schema),
    }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (result.ok) {
      toast.success("Template created");
      router.push(`/org/${params.slug}/settings`);
    } else {
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to create template",
      );
    }

    setSubmitting(false);
  };

  const previewSchema: TemplateSchema = {
    fields: fields.filter((f) => f.key && f.label).map(({ id, ...field }) => field),
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/org/${params.slug}/settings`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <h1 className="text-sm font-bold">New Template</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {showPreview ? (
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
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="template-name"
                  placeholder="Bug Report"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  placeholder="Standard template for reporting bugs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Fields
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  className="gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">
                        Field {index + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      disabled={fields.length <= 1}
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
                        onChange={(e) => updateField(index, { key: e.target.value })}
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
                        onChange={(e) => updateField(index, { label: e.target.value })}
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
                        onValueChange={(v) =>
                          updateField(index, {
                            type: v as TemplateField["type"],
                          })
                        }
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
                          onCheckedChange={(checked) =>
                            updateField(index, {
                              required: checked === true,
                            })
                          }
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
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value
                              .split(",")
                              .map((s) => s.trim())
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
                          onCheckedChange={(checked) =>
                            updateField(index, {
                              multiple: checked === true,
                            })
                          }
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
                          onChange={(e) =>
                            updateField(index, {
                              accept: e.target.value || undefined,
                            })
                          }
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
                        onChange={(e) =>
                          updateField(index, {
                            placeholder: e.target.value || undefined,
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* JSON preview */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                JSON Schema
              </Label>
              <pre className="overflow-auto border bg-muted p-3 text-xs font-mono">
                {JSON.stringify({ fields: fields.filter((f) => f.key && f.label) }, null, 2)}
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
              <Link href={`/org/${params.slug}/settings`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

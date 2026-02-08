"use client";

import type { TemplateField, TemplateSchema } from "@/convex";
import { TEMPLATE_FIELD_TYPES, api } from "@/convex";
import { useMutation } from "convex/react";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateFieldRenderer } from "@/components/issues/template-fields";
import { authClient } from "@/lib/auth-client";

const EMPTY_FIELD: TemplateField = {
  key: "",
  label: "",
  type: "text",
  required: false,
};

export default function NewTemplatePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const createTemplate = useMutation(api.templates.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([{ ...EMPTY_FIELD }]);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const addField = () => {
    setFields((prev) => [...prev, { ...EMPTY_FIELD }]);
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

    const schema: TemplateSchema = { fields: validFields };

    setSubmitting(true);
    try {
      await createTemplate({
        organizationId: activeOrg.id,
        name: name.trim(),
        description: description.trim(),
        schema: JSON.stringify(schema),
      });
      toast.success("Template created");
      router.push(`/org/${params.slug}/settings`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setSubmitting(false);
    }
  };

  const previewSchema: TemplateSchema = {
    fields: fields.filter((f) => f.key && f.label),
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
                <Label>
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Bug Report"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
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
                <div key={index} className="space-y-3 border p-3">
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
                      <Label className="text-xs">Key (camelCase)</Label>
                      <Input
                        placeholder="stepsToReproduce"
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Label</Label>
                      <Input
                        placeholder="Steps to Reproduce"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(v) =>
                          updateField(index, {
                            type: v as TemplateField["type"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
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
                          id={`required-${index}`}
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateField(index, {
                              required: checked === true,
                            })
                          }
                        />
                        <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                          Required
                        </Label>
                      </div>
                    </div>
                  </div>

                  {field.type === "select" && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Options (comma-separated)</Label>
                      <Input
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

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Placeholder (optional)</Label>
                    <Input
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

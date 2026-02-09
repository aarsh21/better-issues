"use client";

import type { TemplateField } from "@/convex";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TemplateFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `template-field-${field.key}`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

      {field.type === "text" && (
        <Input
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "url" && (
        <Input
          id={id}
          type="url"
          placeholder={field.placeholder ?? "https://..."}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      )}

      {field.type === "number" && (
        <Input
          id={id}
          type="number"
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        />
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
            {field.placeholder ?? "Yes"}
          </Label>
        </div>
      )}

      {field.type === "select" && field.options && (
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

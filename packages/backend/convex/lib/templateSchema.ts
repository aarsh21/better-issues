import { z } from "zod";

export const TEMPLATE_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "checkbox",
  "number",
  "url",
] as const;

export type TemplateFieldType = (typeof TEMPLATE_FIELD_TYPES)[number];

export const templateFieldSchema = z
  .object({
    key: z
      .string()
      .min(1, "Key is required")
      .regex(/^[a-z][a-zA-Z0-9]*$/, "Key must be camelCase (start lowercase, alphanumeric only)"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(TEMPLATE_FIELD_TYPES),
    required: z.boolean(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .refine(
    (field) => {
      if (field.type === "select" && (!field.options || field.options.length < 1)) {
        return false;
      }
      return true;
    },
    { message: "Select fields must have at least one option" },
  );

export const templateSchemaValidator = z.object({
  fields: z
    .array(templateFieldSchema)
    .min(1, "Template must have at least one field")
    .refine(
      (fields) => {
        const keys = fields.map((f) => f.key);
        return new Set(keys).size === keys.length;
      },
      { message: "Field keys must be unique" },
    ),
});

export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateSchema = z.infer<typeof templateSchemaValidator>;

export function parseTemplateSchema(json: string): TemplateSchema {
  const parsed: unknown = JSON.parse(json);
  return templateSchemaValidator.parse(parsed);
}

export function validateTemplateData(
  schema: TemplateSchema,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of schema.fields) {
    const value = data[field.key];

    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    switch (field.type) {
      case "number":
        if (typeof value !== "number" && isNaN(Number(value))) {
          errors.push(`${field.label} must be a number`);
        }
        break;
      case "checkbox":
        if (typeof value !== "boolean") {
          errors.push(`${field.label} must be a boolean`);
        }
        break;
      case "select":
        if (field.options && !field.options.includes(String(value))) {
          errors.push(`${field.label} must be one of: ${field.options.join(", ")}`);
        }
        break;
      case "url":
        try {
          new URL(String(value));
        } catch {
          errors.push(`${field.label} must be a valid URL`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

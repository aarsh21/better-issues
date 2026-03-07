import { z } from "zod";

export const TEMPLATE_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "checkbox",
  "number",
  "url",
  "file",
] as const;

export type Id<TTable extends string> = string & { readonly __table?: TTable };

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
    accept: z.string().optional(),
    multiple: z.boolean().optional(),
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
        const keys = fields.map((field) => field.key);
        return new Set(keys).size === keys.length;
      },
      { message: "Field keys must be unique" },
    ),
});

export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateSchema = z.infer<typeof templateSchemaValidator>;

export function parseTemplateSchema(json: string): TemplateSchema {
  return templateSchemaValidator.parse(JSON.parse(json) as unknown);
}

export type TemplateFileValue = {
  storageId: Id<"attachments">;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export function validateTemplateData(
  schema: TemplateSchema,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of schema.fields) {
    const value = data[field.key];
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isEmptyValue = value === undefined || value === null || value === "" || isEmptyArray;

    if (field.required && isEmptyValue) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (isEmptyValue) {
      continue;
    }

    switch (field.type) {
      case "number":
        if (typeof value !== "number" && Number.isNaN(Number(value))) {
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
      case "file": {
        const allowsMultiple = field.multiple !== false;
        const isValidFile = (candidate: unknown) => {
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
            Number.isFinite(record.fileSize) &&
            record.fileSize >= 0
          );
        };

        if (allowsMultiple) {
          if (!Array.isArray(value)) {
            errors.push(`${field.label} must include one or more files`);
            break;
          }

          if (value.some((file) => !isValidFile(file))) {
            errors.push(`${field.label} must include valid file uploads`);
          }
        } else if (!isValidFile(value)) {
          errors.push(`${field.label} must include a valid file`);
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export type SessionDto = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  image?: string | null;
  activeOrganizationId?: string | null;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type LabelDto = {
  _id: Id<"labels">;
  _creationTime: number;
  organizationId: string;
  name: string;
  color: string;
  description?: string | null;
};

export type TemplateDto = {
  _id: Id<"issueTemplates">;
  _creationTime: number;
  organizationId: string;
  name: string;
  description: string;
  schema: string;
  createdBy: string;
  createdAt: number;
};

export type IssueStatus = "open" | "in_progress" | "closed";
export type IssuePriority = "low" | "medium" | "high" | "urgent";

export type IssueListItemDto = {
  _id: Id<"issues">;
  _creationTime: number;
  organizationId: string;
  number: number;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string | null;
  labelIds: Id<"labels">[];
  createdBy: string;
  templateId?: Id<"issueTemplates"> | null;
  templateData?: string | null;
  createdAt: number;
  updatedAt: number;
  closedAt?: number | null;
};

export type IssueDetailDto = IssueListItemDto;

export type AttachmentDto = {
  _id: Id<"attachments">;
  _creationTime: number;
  organizationId: string;
  issueId?: Id<"issues"> | null;
  uploadedByUserId: string;
  providerKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string | null;
};

type DocMap = {
  labels: LabelDto;
  issueTemplates: TemplateDto;
  issues: IssueDetailDto;
  attachments: AttachmentDto;
  _storage: {
    _id: Id<"_storage">;
  };
};

export type Doc<TTable extends keyof DocMap> = DocMap[TTable];

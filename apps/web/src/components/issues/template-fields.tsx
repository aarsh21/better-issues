"use client";

import type { Id, TemplateField, TemplateFileValue } from "@/lib/api-contracts";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiClient } from "@better-issues/api-client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { unwrapResponse } from "@/lib/api";
import { useUploadThing } from "@/lib/uploadthing";
import { formatFileSize } from "@/lib/utils";

const isTemplateFileValue = (candidate: unknown): candidate is TemplateFileValue => {
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
    typeof record.fileName === "string" &&
    typeof record.fileType === "string" &&
    typeof record.fileSize === "number"
  );
};

const normalizeFileValues = (value: unknown, allowMultiple: boolean) => {
  if (Array.isArray(value)) {
    const files = value.filter(isTemplateFileValue);
    return allowMultiple ? files : files.slice(0, 1);
  }

  if (isTemplateFileValue(value)) {
    return [value];
  }

  return [];
};

export function TemplateFieldRenderer({
  field,
  value,
  onChange,
  readOnly = false,
  organizationId,
  issueId,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  organizationId?: string;
  issueId?: Id<"issues">;
}) {
  const id = `template-field-${field.key}`;
  const allowMultiple = field.type === "file" ? field.multiple !== false : false;
  const files = field.type === "file" ? normalizeFileValues(value, allowMultiple) : [];
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("issueAttachment", {
    onUploadError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const input = event.currentTarget;

    if (!organizationId) {
      toast.error("Organization context is required for file uploads");
      input.value = "";
      return;
    }

    const selectedFiles = Array.from(input.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const filesToUpload = allowMultiple ? selectedFiles : [selectedFiles[0]!];
    setUploading(true);

    try {
      const uploaded = await startUpload(filesToUpload, {
        organizationId,
        issueId,
      });

      const nextFiles: TemplateFileValue[] = (uploaded ?? []).map((file) => {
        const serverData = file.serverData as { attachmentId?: string } | null;
        if (!serverData?.attachmentId) {
          throw new Error("Upload failed");
        }

        return {
          storageId: serverData.attachmentId as Id<"attachments">,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
      });

      if (allowMultiple) {
        onChange([...files, ...nextFiles]);
      } else {
        const previous = files[0];
        onChange(nextFiles[0]);

        if (previous) {
          await unwrapResponse(
            apiClient.api.v1.attachments({ attachmentId: previous.storageId }).delete(),
          ).catch(() => undefined);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const handleRemoveFile = async (storageId: Id<"attachments">) => {
    if (readOnly) return;

    const nextFiles = files.filter((file) => file.storageId !== storageId);
    onChange(allowMultiple ? nextFiles : undefined);

    await unwrapResponse(apiClient.api.v1.attachments({ attachmentId: storageId }).delete()).catch(
      (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove file");
      },
    );
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm">
        {field.label}
        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}

      {field.type === "text" ? (
        <Input
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
        />
      ) : null}

      {field.type === "url" ? (
        <Input
          id={id}
          type="url"
          placeholder={field.placeholder ?? "https://..."}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
        />
      ) : null}

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          disabled={readOnly}
        />
      ) : null}

      {field.type === "number" ? (
        <Input
          id={id}
          type="number"
          placeholder={field.placeholder}
          value={(value as string | number | undefined) ?? ""}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : "")}
          disabled={readOnly}
        />
      ) : null}

      {field.type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
            disabled={readOnly}
          />
          <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
            {field.placeholder ?? "Yes"}
          </Label>
        </div>
      ) : null}

      {field.type === "select" && field.options ? (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(nextValue) => onChange(nextValue)}
          disabled={readOnly}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {field.type === "file" ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <Input
              id={id}
              type="file"
              multiple={allowMultiple}
              accept={field.accept}
              onChange={(event) => {
                void handleFilesSelected(event);
              }}
              disabled={readOnly || uploading}
            />
            {uploading ? <span className="text-xs text-muted-foreground">Uploading...</span> : null}
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground">No files uploaded</p>
          ) : (
            <div className="grid gap-2">
              {files.map((file) => (
                <div
                  key={file.storageId}
                  className="flex items-center justify-between border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                  </div>
                  {!readOnly ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        void handleRemoveFile(file.storageId);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import type { Id, TemplateField } from "@/convex";

import { useMutation } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex";
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
import { formatFileSize } from "@/lib/utils";

type TemplateFileValue = {
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
};

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
    record.storageId.length > 0 &&
    typeof record.fileName === "string" &&
    record.fileName.length > 0 &&
    typeof record.fileType === "string" &&
    typeof record.fileSize === "number" &&
    Number.isFinite(record.fileSize)
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
}: {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  organizationId?: string;
}) {
  const id = `template-field-${field.key}`;
  const allowMultiple = field.type === "file" ? field.multiple !== false : false;
  const files = field.type === "file" ? normalizeFileValues(value, allowMultiple) : [];

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const removeFile = useMutation(api.files.remove);

  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);

    if (selectedFiles.length === 0) return;

    const filesToUpload = allowMultiple ? selectedFiles : [selectedFiles[0]!];

    setUploading(true);
    let encounteredError: unknown = null;

    // Generate upload URLs and upload files in parallel
    const uploadResults = await Promise.all(
      filesToUpload.map(async (file) => {
        const uploadUrl = await generateUploadUrl({ organizationId: organizationId! });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const result = (await response.json()) as { storageId?: string };
        if (!result.storageId) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return {
          storageId: result.storageId as Id<"_storage">,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        } satisfies TemplateFileValue;
      }),
    ).catch((error) => {
      encounteredError = error;
      return [] as TemplateFileValue[];
    });

    if (encounteredError) {
      toast.error(encounteredError instanceof Error ? encounteredError.message : "Upload failed");
    }

    if (uploadResults.length > 0) {
      const existingFiles = normalizeFileValues(value, allowMultiple);
      if (allowMultiple) {
        onChange([...existingFiles, ...uploadResults]);
      } else {
        const previousFile = existingFiles[0];
        onChange(uploadResults[0]);
        if (previousFile) {
          await removeFile({
            organizationId: organizationId!,
            storageId: previousFile.storageId,
          }).catch(() => {
            // Best-effort cleanup.
          });
        }
      }
    }

    setUploading(false);
    input.value = "";
  };

  const handleRemoveFile = async (storageId: Id<"_storage">) => {
    if (readOnly) return;

    const nextFiles = files.filter((file) => file.storageId !== storageId);
    onChange(allowMultiple ? nextFiles : undefined);

    const result = await removeFile({ organizationId: organizationId!, storageId }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (!result.ok) {
      toast.error(result.error instanceof Error ? result.error.message : "Failed to remove file");
    }
  };

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
          disabled={readOnly}
        />
      )}

      {field.type === "url" && (
        <Input
          id={id}
          type="url"
          placeholder={field.placeholder ?? "https://..."}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          disabled={readOnly}
        />
      )}

      {field.type === "number" && (
        <Input
          id={id}
          type="number"
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          disabled={readOnly}
        />
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={readOnly}
          />
          <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
            {field.placeholder ?? "Yes"}
          </Label>
        </div>
      )}

      {field.type === "select" && field.options && (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
          disabled={readOnly}
        >
          <SelectTrigger id={id} disabled={readOnly}>
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

      {field.type === "file" && (
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <Input
              id={id}
              type="file"
              accept={field.accept}
              multiple={allowMultiple}
              onChange={handleFilesSelected}
              disabled={readOnly || uploading}
            />
            {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground">No files uploaded</p>
          ) : (
            <div className="grid gap-2">
              {files.map((file) => (
                <div
                  key={file.storageId}
                  className="flex items-center justify-between border px-3 py-2"
                >
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveFile(file.storageId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

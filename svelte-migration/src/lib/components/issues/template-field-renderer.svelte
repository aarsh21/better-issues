<script lang="ts">
  import XIcon from "@lucide/svelte/icons/x";
  import { useMutation, useQuery } from "@mmailaender/convex-svelte";
  import { toast } from "svelte-sonner";

  import { api } from "$convex/_generated/api";
  import type { Id } from "$convex/_generated/dataModel";
  import type { TemplateField } from "$convex/lib/templateSchema";
  import { Button } from "$lib/components/ui/button";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { formatFileSize } from "$lib/utils";

  type TemplateFileValue = {
    storageId: Id<"_storage">;
    fileName: string;
    fileType: string;
    fileSize: number;
  };

  let {
    field,
    value = $bindable(),
    readOnly = false,
    organizationId,
    issueId,
  }: {
    field: TemplateField;
    value?: unknown;
    readOnly?: boolean;
    organizationId?: string;
    issueId?: Id<"issues">;
  } = $props();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const removeFile = useMutation(api.files.remove);

  const allowMultiple = $derived(field.type === "file" ? field.multiple !== false : false);
  const inputId = $derived(`template-field-${field.key}`);
  let uploading = $state(false);

  function isTemplateFileValue(candidate: unknown): candidate is TemplateFileValue {
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
  }

  function normalizeFileValues(candidate: unknown, multiple: boolean) {
    if (Array.isArray(candidate)) {
      const files = candidate.filter(isTemplateFileValue);
      return multiple ? files : files.slice(0, 1);
    }

    if (isTemplateFileValue(candidate)) {
      return [candidate];
    }

    return [] as TemplateFileValue[];
  }

  const files = $derived(field.type === "file" ? normalizeFileValues(value, allowMultiple) : []);
  const fileUrls = useQuery(
    api.files.getUrls,
    () =>
      organizationId && issueId && files.length > 0
        ? {
            organizationId,
            issueId,
            storageIds: files.map((file) => file.storageId),
          }
        : "skip",
  );
  const fileUrlMap = $derived(
    new Map((fileUrls.data ?? []).map((entry) => [entry.storageId, entry.url])),
  );

  async function handleFilesSelected(event: Event) {
    if (readOnly) return;
    const input = event.currentTarget as HTMLInputElement;
    if (!organizationId) {
      toast.error("Organization context is required for file uploads");
      input.value = "";
      return;
    }

    const selectedFiles = Array.from(input.files ?? []);
    if (selectedFiles.length === 0) return;

    const filesToUpload = allowMultiple ? selectedFiles : [selectedFiles[0]!];

    uploading = true;
    try {
      const uploadResults = await Promise.all(
        filesToUpload.map(async (file) => {
          const uploadUrl = await generateUploadUrl({ organizationId });
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
      );

      const existingFiles = normalizeFileValues(value, allowMultiple);
      if (allowMultiple) {
        value = [...existingFiles, ...uploadResults];
      } else {
        const previousFile = existingFiles[0];
        value = uploadResults[0];
        if (previousFile && issueId) {
          await removeFile({
            organizationId,
            issueId,
            storageId: previousFile.storageId,
          }).catch(() => undefined);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      uploading = false;
      input.value = "";
    }
  }

  async function handleRemoveFile(storageId: Id<"_storage">) {
    if (readOnly) return;
    if (!organizationId) {
      toast.error("Organization context is required for file removal");
      return;
    }

    const nextFiles = files.filter((file) => file.storageId !== storageId);
    value = allowMultiple ? nextFiles : undefined;
    if (!issueId) {
      return;
    }

    try {
      await removeFile({ organizationId, issueId, storageId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove file");
    }
  }
</script>

<div class="grid gap-2">
  <Label for={inputId} class="text-sm">
    {field.label}
    {#if field.required}<span class="text-destructive ml-1">*</span>{/if}
  </Label>
  {#if field.description}
    <p class="text-muted-foreground text-xs">{field.description}</p>
  {/if}

  {#if field.type === "text" || field.type === "url"}
    <Input
      id={inputId}
      type={field.type === "url" ? "url" : "text"}
      placeholder={field.placeholder ?? (field.type === "url" ? "https://..." : undefined)}
      value={typeof value === "string" ? value : ""}
      onchange={(event) => {
        value = (event.currentTarget as HTMLInputElement).value;
      }}
      disabled={readOnly}
    />
  {:else if field.type === "textarea"}
    <Textarea
      id={inputId}
      placeholder={field.placeholder}
      rows={4}
      value={typeof value === "string" ? value : ""}
      onchange={(event) => {
        value = (event.currentTarget as HTMLTextAreaElement).value;
      }}
      disabled={readOnly}
    />
  {:else if field.type === "number"}
    <Input
      id={inputId}
      type="number"
      placeholder={field.placeholder}
      value={typeof value === "number" ? String(value) : typeof value === "string" ? value : ""}
      onchange={(event) => {
        const next = (event.currentTarget as HTMLInputElement).value;
        value = next ? Number(next) : "";
      }}
      disabled={readOnly}
    />
  {:else if field.type === "checkbox"}
    <div class="flex items-center gap-2">
      <Checkbox
        id={inputId}
        checked={value === true}
        onCheckedChange={(checked) => {
          value = checked === true;
        }}
        disabled={readOnly}
      />
      <Label for={inputId} class="cursor-pointer text-sm font-normal">
        {field.placeholder ?? "Yes"}
      </Label>
    </div>
  {:else if field.type === "select" && field.options}
    <select
      id={inputId}
      class="border-input bg-background text-foreground h-8 w-full rounded-none border px-2 text-sm outline-none"
      value={typeof value === "string" ? value : ""}
      onchange={(event) => {
        value = (event.currentTarget as HTMLSelectElement).value;
      }}
      disabled={readOnly}
    >
      <option value="">{field.placeholder ?? "Select..."}</option>
      {#each field.options as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
  {:else if field.type === "file"}
    <div class="grid gap-3">
      {#if !readOnly}
        <div class="flex items-center gap-3">
          <Input
            id={inputId}
            type="file"
            accept={field.accept}
            multiple={allowMultiple}
            onchange={handleFilesSelected}
            disabled={uploading}
          />
          {#if uploading}
            <span class="text-muted-foreground text-xs">Uploading...</span>
          {/if}
        </div>
      {/if}

      {#if files.length === 0}
        <p class="text-muted-foreground text-xs">No files uploaded</p>
      {:else}
        <div class="grid gap-2">
          {#each files as file (file.storageId)}
            <div class="border-border flex items-center justify-between border px-3 py-2">
              <div class="grid gap-0.5">
                <p class="text-sm font-medium">{file.fileName}</p>
                <p class="text-muted-foreground text-xs">{formatFileSize(file.fileSize)}</p>
                {#if readOnly && fileUrlMap.get(file.storageId)}
                  <a
                    href={fileUrlMap.get(file.storageId) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    class="text-primary text-xs hover:underline"
                  >
                    Open file
                  </a>
                {/if}
              </div>
              {#if !readOnly}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onclick={() => void handleRemoveFile(file.storageId)}
                >
                  <XIcon class="h-3 w-3" />
                </Button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

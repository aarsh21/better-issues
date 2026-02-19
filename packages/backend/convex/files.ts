import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireOrgMembership, requirePermission } from "./lib/permissions";
import { parseTemplateSchema } from "./lib/templateSchema";

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
    Number.isFinite(record.fileSize) &&
    record.fileSize >= 0
  );
};

const collectIssueStorageIds = (
  issue: Doc<"issues">,
  template: Doc<"issueTemplates"> | null,
): Set<Id<"_storage">> => {
  if (!issue.templateData || !template) {
    return new Set();
  }

  try {
    const parsedTemplateData = JSON.parse(issue.templateData) as unknown;
    if (
      !parsedTemplateData ||
      typeof parsedTemplateData !== "object" ||
      Array.isArray(parsedTemplateData)
    ) {
      return new Set();
    }

    const schema = parseTemplateSchema(template.schema);
    const data = parsedTemplateData as Record<string, unknown>;
    const storageIds = new Set<Id<"_storage">>();

    for (const field of schema.fields) {
      if (field.type !== "file") {
        continue;
      }

      const fieldValue = data[field.key];
      const allowsMultiple = field.multiple !== false;

      if (allowsMultiple) {
        if (!Array.isArray(fieldValue)) {
          continue;
        }

        for (const value of fieldValue) {
          if (isTemplateFileValue(value)) {
            storageIds.add(value.storageId);
          }
        }
        continue;
      }

      if (isTemplateFileValue(fieldValue)) {
        storageIds.add(fieldValue.storageId);
      }
    }

    return storageIds;
  } catch {
    return new Set();
  }
};

async function getIssueStorageIds(
  ctx: QueryCtx | MutationCtx,
  issueId: Id<"issues">,
  organizationId: string,
): Promise<Set<Id<"_storage">>> {
  const issue = await ctx.db.get(issueId);
  if (!issue || issue.organizationId !== organizationId) {
    throw new ConvexError("Issue not found");
  }

  if (!issue.templateId) {
    return new Set();
  }

  const template = await ctx.db.get(issue.templateId);
  if (!template || template.organizationId !== organizationId) {
    return new Set();
  }

  return collectIssueStorageIds(issue, template);
}

export const generateUploadUrl = mutation({
  args: {
    organizationId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    await requireOrgMembership(ctx, user._id, args.organizationId);

    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrls = query({
  args: {
    organizationId: v.string(),
    issueId: v.id("issues"),
    storageIds: v.array(v.id("_storage")),
  },
  returns: v.array(
    v.object({
      storageId: v.id("_storage"),
      url: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    await requireOrgMembership(ctx, user._id, args.organizationId);
    const issueStorageIds = await getIssueStorageIds(ctx, args.issueId, args.organizationId);

    return await Promise.all(
      args.storageIds.map(async (storageId) => {
        if (!issueStorageIds.has(storageId)) {
          return {
            storageId,
            url: null,
          };
        }

        return {
          storageId,
          url: await ctx.storage.getUrl(storageId),
        };
      }),
    );
  },
});

export const remove = mutation({
  args: {
    organizationId: v.string(),
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    await requirePermission(ctx, user._id, args.organizationId, "issue", "update");
    const issueStorageIds = await getIssueStorageIds(ctx, args.issueId, args.organizationId);
    if (!issueStorageIds.has(args.storageId)) {
      throw new ConvexError("File not found");
    }

    await ctx.storage.delete(args.storageId);
    return null;
  },
});

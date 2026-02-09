import type { Id } from "./_generated/dataModel";

import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { parseTemplateSchema, validateTemplateData } from "./lib/templateSchema";

const issueValidator = v.object({
  _id: v.id("issues"),
  _creationTime: v.number(),
  organizationId: v.string(),
  number: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed")),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
  assigneeId: v.optional(v.string()),
  labelIds: v.array(v.id("labels")),
  createdBy: v.string(),
  templateId: v.optional(v.id("issueTemplates")),
  templateData: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  closedAt: v.optional(v.number()),
});

export const list = query({
  args: {
    organizationId: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed"))),
    assigneeId: v.optional(v.string()),
    labelId: v.optional(v.id("labels")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(issueValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null()),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    let issueQuery;

    if (args.status) {
      issueQuery = ctx.db
        .query("issues")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", args.status!),
        );
    } else {
      issueQuery = ctx.db
        .query("issues")
        .withIndex("by_org_and_status", (q) => q.eq("organizationId", args.organizationId));
    }

    const result = await issueQuery.order("desc").paginate(args.paginationOpts);

    let filteredPage = result.page;

    if (args.assigneeId) {
      filteredPage = filteredPage.filter((i) => i.assigneeId === args.assigneeId);
    }

    if (args.labelId) {
      filteredPage = filteredPage.filter((i) => i.labelIds.includes(args.labelId!));
    }

    return { ...result, page: filteredPage };
  },
});

export const search = query({
  args: {
    organizationId: v.string(),
    searchQuery: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed"))),
  },
  returns: v.array(issueValidator),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    if (!args.searchQuery.trim()) return [];

    let searchQuery = ctx.db.query("issues").withSearchIndex("search_issues", (q) => {
      let sq = q.search("title", args.searchQuery).eq("organizationId", args.organizationId);
      if (args.status) {
        sq = sq.eq("status", args.status);
      }
      return sq;
    });

    return await searchQuery.take(20);
  },
});

export const getByNumber = query({
  args: {
    organizationId: v.string(),
    number: v.number(),
  },
  returns: v.union(issueValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_org_and_number", (q) =>
        q.eq("organizationId", args.organizationId).eq("number", args.number),
      )
      .unique();

    return issue;
  },
});

export const create = mutation({
  args: {
    organizationId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    assigneeId: v.optional(v.string()),
    labelIds: v.array(v.id("labels")),
    templateId: v.optional(v.id("issueTemplates")),
    templateData: v.optional(v.string()),
  },
  returns: v.object({ issueId: v.id("issues"), number: v.number() }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    if (!args.title.trim()) {
      throw new ConvexError("Title is required");
    }

    let parsedTemplateData: Record<string, unknown> | null = null;
    if (args.templateData !== undefined) {
      try {
        const parsed = JSON.parse(args.templateData) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new ConvexError("Template data must be an object");
        }
        parsedTemplateData = parsed as Record<string, unknown>;
      } catch (error) {
        if (error instanceof ConvexError) {
          throw error;
        }
        throw new ConvexError("Invalid template data");
      }
    }

    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (!template) throw new ConvexError("Template not found");

      let schema;
      try {
        schema = parseTemplateSchema(template.schema);
      } catch (error) {
        throw new ConvexError(
          `Invalid template schema: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      const validation = validateTemplateData(schema, parsedTemplateData ?? {});
      if (!validation.valid) {
        throw new ConvexError(validation.errors.join(", "));
      }
    } else if (parsedTemplateData !== null) {
      throw new ConvexError("Template data provided without template");
    }

    const existingIssues = await ctx.db
      .query("issues")
      .withIndex("by_org_and_number", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .first();

    const nextNumber = existingIssues ? existingIssues.number + 1 : 1;

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      organizationId: args.organizationId,
      number: nextNumber,
      title: args.title.trim(),
      description: args.description?.trim(),
      status: "open",
      priority: args.priority,
      assigneeId: args.assigneeId,
      labelIds: args.labelIds,
      createdBy: user._id,
      templateId: args.templateId,
      templateData: args.templateData,
      createdAt: now,
      updatedAt: now,
    });

    return { issueId, number: nextNumber };
  },
});

export const update = mutation({
  args: {
    issueId: v.id("issues"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    ),
    assigneeId: v.optional(v.union(v.string(), v.null())),
    labelIds: v.optional(v.array(v.id("labels"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new ConvexError("Issue not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      if (!args.title.trim()) throw new ConvexError("Title cannot be empty");
      updates.title = args.title.trim();
    }
    if (args.description !== undefined) updates.description = args.description?.trim();
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assigneeId !== undefined) {
      updates.assigneeId = args.assigneeId === null ? undefined : args.assigneeId;
    }
    if (args.labelIds !== undefined) updates.labelIds = args.labelIds;

    await ctx.db.patch(args.issueId, updates);
  },
});

export const updateStatus = mutation({
  args: {
    issueId: v.id("issues"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new ConvexError("Issue not found");

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "closed") {
      updates.closedAt = Date.now();
    } else if (issue.status === "closed") {
      updates.closedAt = undefined;
    }

    await ctx.db.patch(args.issueId, updates);
  },
});

export const remove = mutation({
  args: {
    issueId: v.id("issues"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new ConvexError("Issue not found");

    if (issue.templateId && issue.templateData) {
      const template = await ctx.db.get(issue.templateId);
      if (template) {
        try {
          const parsedTemplateData = JSON.parse(issue.templateData) as Record<string, unknown>;
          if (
            parsedTemplateData &&
            typeof parsedTemplateData === "object" &&
            !Array.isArray(parsedTemplateData)
          ) {
            const schema = parseTemplateSchema(template.schema);
            const storageIds: Id<"_storage">[] = [];

            const addStorageId = (candidate: unknown) => {
              if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
                return;
              }
              const record = candidate as { storageId?: unknown };
              if (typeof record.storageId === "string") {
                storageIds.push(record.storageId as Id<"_storage">);
              }
            };

            for (const field of schema.fields) {
              if (field.type !== "file") continue;
              const rawValue = parsedTemplateData[field.key];
              const allowsMultiple = field.multiple !== false;
              if (allowsMultiple) {
                if (Array.isArray(rawValue)) {
                  rawValue.forEach(addStorageId);
                }
              } else {
                addStorageId(rawValue);
              }
            }

            await Promise.allSettled(
              storageIds.map(async (storageId) => {
                try {
                  await ctx.storage.delete(storageId);
                } catch {
                  return;
                }
              }),
            );
          }
        } catch {
          // Best-effort cleanup; ignore parse or delete failures.
        }
      }
    }

    await ctx.db.delete(args.issueId);
  },
});

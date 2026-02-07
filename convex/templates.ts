import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { parseTemplateSchema } from "./lib/templateSchema";

const templateValidator = v.object({
  _id: v.id("issueTemplates"),
  _creationTime: v.number(),
  organizationId: v.string(),
  name: v.string(),
  description: v.string(),
  schema: v.string(),
  createdBy: v.string(),
  createdAt: v.number(),
});

export const list = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.array(templateValidator),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    return await ctx.db
      .query("issueTemplates")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const get = query({
  args: {
    templateId: v.id("issueTemplates"),
  },
  returns: v.union(templateValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    return await ctx.db.get(args.templateId);
  },
});

export const create = mutation({
  args: {
    organizationId: v.string(),
    name: v.string(),
    description: v.string(),
    schema: v.string(),
  },
  returns: v.id("issueTemplates"),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    if (!args.name.trim()) {
      throw new ConvexError("Template name is required");
    }

    try {
      parseTemplateSchema(args.schema);
    } catch (e) {
      throw new ConvexError(
        `Invalid template schema: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    }

    return await ctx.db.insert("issueTemplates", {
      organizationId: args.organizationId,
      name: args.name.trim(),
      description: args.description.trim(),
      schema: args.schema,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    templateId: v.id("issueTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    schema: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new ConvexError("Template not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      if (!args.name.trim()) throw new ConvexError("Template name cannot be empty");
      updates.name = args.name.trim();
    }
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.schema !== undefined) {
      try {
        parseTemplateSchema(args.schema);
      } catch (e) {
        throw new ConvexError(
          `Invalid template schema: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
      updates.schema = args.schema;
    }

    await ctx.db.patch(args.templateId, updates);
  },
});

export const remove = mutation({
  args: {
    templateId: v.id("issueTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new ConvexError("Template not found");

    await ctx.db.delete(args.templateId);
  },
});

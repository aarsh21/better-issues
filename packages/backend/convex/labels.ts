import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const labelValidator = v.object({
  _id: v.id("labels"),
  _creationTime: v.number(),
  organizationId: v.string(),
  name: v.string(),
  color: v.string(),
  description: v.optional(v.string()),
});

export const list = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.array(labelValidator),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    return await ctx.db
      .query("labels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const create = mutation({
  args: {
    organizationId: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("labels"),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    if (!args.name.trim()) {
      throw new ConvexError("Label name is required");
    }

    const existing = await ctx.db
      .query("labels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (existing.length >= 15) {
      throw new ConvexError("Maximum of 15 labels per organization");
    }

    if (existing.some((l) => l.name.toLowerCase() === args.name.trim().toLowerCase())) {
      throw new ConvexError("A label with this name already exists");
    }

    return await ctx.db.insert("labels", {
      organizationId: args.organizationId,
      name: args.name.trim(),
      color: args.color,
      description: args.description?.trim(),
    });
  },
});

export const update = mutation({
  args: {
    labelId: v.id("labels"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const label = await ctx.db.get(args.labelId);
    if (!label) throw new ConvexError("Label not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      if (!args.name.trim()) throw new ConvexError("Label name cannot be empty");
      updates.name = args.name.trim();
    }
    if (args.color !== undefined) updates.color = args.color;
    if (args.description !== undefined) updates.description = args.description?.trim();

    await ctx.db.patch(args.labelId, updates);
  },
});

export const remove = mutation({
  args: {
    labelId: v.id("labels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const label = await ctx.db.get(args.labelId);
    if (!label) throw new ConvexError("Label not found");

    await ctx.db.delete(args.labelId);
  },
});

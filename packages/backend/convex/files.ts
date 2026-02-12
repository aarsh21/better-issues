import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireOrgMembership } from "./lib/permissions";

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

    return await Promise.all(
      args.storageIds.map(async (storageId) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      })),
    );
  },
});

export const remove = mutation({
  args: {
    organizationId: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    await requireOrgMembership(ctx, user._id, args.organizationId);

    await ctx.storage.delete(args.storageId);
    return null;
  },
});

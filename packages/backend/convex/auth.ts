import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authComponent, createAuth } from "./betterAuth/auth";

export { authComponent, createAuth };

const authUserValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  image: v.optional(v.union(v.null(), v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
  username: v.optional(v.union(v.null(), v.string())),
  displayUsername: v.optional(v.union(v.null(), v.string())),
  userId: v.optional(v.union(v.null(), v.string())),
});

export const getCurrentUser = query({
  args: {},
  returns: v.union(authUserValidator, v.null()),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const image = user.image;
    if (typeof image !== "string" || !image.startsWith("storage:")) {
      return user;
    }

    const storageId = image.slice("storage:".length);
    if (storageId.length === 0) {
      return {
        ...user,
        image: null,
      };
    }

    try {
      const imageUrl = await ctx.storage.getUrl(storageId as Id<"_storage">);
      return {
        ...user,
        image: imageUrl,
      };
    } catch {
      return {
        ...user,
        image: null,
      };
    }
  },
});

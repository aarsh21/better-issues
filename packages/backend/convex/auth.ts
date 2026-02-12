import { v } from "convex/values";

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
  userId: v.optional(v.union(v.null(), v.string())),
});

export const getCurrentUser = query({
  args: {},
  returns: v.union(authUserValidator, v.null()),
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});

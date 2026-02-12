import { v } from "convex/values";

import { query } from "./_generated/server";
import { authComponent, createAuth } from "./betterAuth/auth";

export { authComponent, createAuth };

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

import { query } from "./_generated/server";
import { authComponent, createAuth } from "./betterAuth/auth";

export { authComponent, createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

import { ConvexError, v } from "convex/values";

import { authComponent } from "./auth";
import { loggedQuery } from "./lib/logging";

export const get = loggedQuery("privateData.get")({
  args: {},
  returns: v.object({ message: v.string() }),
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    return {
      message: "This is private",
    };
  },
});

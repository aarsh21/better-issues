import { v } from "convex/values";

import { loggedQuery } from "./lib/logging";

export const get = loggedQuery("healthCheck.get")({
  args: {},
  returns: v.string(),
  handler: async () => {
    return "OK";
  },
});

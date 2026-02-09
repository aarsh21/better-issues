import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import { ac, admin, member, owner } from "../lib/permissions";
import schema from "./schema";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
  local: { schema },
});

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: process.env.SITE_URL,
    trustedOrigins: [process.env.SITE_URL!],
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
      organization({
        ac,
        roles: { owner, admin, member },
      }),
    ],
  } satisfies BetterAuthOptions;
};

// For `@better-auth/cli` schema generation
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

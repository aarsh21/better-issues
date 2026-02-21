import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { haveIBeenPwned, organization, username } from "better-auth/plugins";

import { components, internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import { ac, admin, member, owner } from "../lib/permissions";
import schema from "./schema";

const isSignupsEnabled = (value: string | undefined) => {
  if (!value) {
    return true;
  }

  return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
};

const signupsEnabled = isSignupsEnabled(process.env.ALLOWED_SIGNUPS);

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
      disableSignUp: !signupsEnabled,
      requireEmailVerification: false,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }

        const body = ctx.body as Record<string, unknown> | undefined;
        const usernameValue = body?.username;

        if (typeof usernameValue !== "string" || usernameValue.trim().length === 0) {
          throw new APIError("BAD_REQUEST", {
            message: "Username is required",
          });
        }
      }),
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
      organization({
        ac,
        roles: { owner, admin, member },
        organizationHooks: {
          afterCreateOrganization: async ({ organization }) => {
            if (!("runMutation" in ctx)) {
              return;
            }

            await ctx.runMutation(internal.labels.seedDefaultsForOrganization, {
              organizationId: organization.id,
            });
          },
        },
      }),
      username(),
      haveIBeenPwned({
        customPasswordCompromisedMessage:
          "This password appears in known breaches. Please choose a more secure password.",
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

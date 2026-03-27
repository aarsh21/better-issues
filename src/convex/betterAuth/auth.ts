import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { haveIBeenPwned, organization, username } from "better-auth/plugins";

import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import { ac, admin, member, owner } from "../../lib/permissions";
import schema from "./schema";

const isSignupsEnabled = (value: string | undefined) => {
	if (!value) {
		return true;
	}

	return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
};

const normalizeUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") || undefined;
const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const getAuthEnv = () => {
	const siteUrl = normalizeUrl(process.env.SITE_URL);
	const betterAuthUrl = normalizeUrl(process.env.BETTER_AUTH_URL);
	return {
		baseUrl: betterAuthUrl ?? siteUrl,
		trustedOrigins: Array.from(new Set([siteUrl, betterAuthUrl].filter(isDefined))),
		signupsEnabled: isSignupsEnabled(process.env.ALLOWED_SIGNUPS),
	};
};

export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
	local: { schema },
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	const { baseUrl, trustedOrigins, signupsEnabled } = getAuthEnv();
	return {
		baseURL: baseUrl,
		trustedOrigins,
		secret: process.env.BETTER_AUTH_SECRET,
		rateLimit: {
			enabled: false,
		},
		advanced: {
			ipAddress: {
				disableIpTracking: true,
			}
		},
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			disableSignUp: !signupsEnabled,
			requireEmailVerification: false
		},
		hooks: {
			before: createAuthMiddleware(async (hookCtx) => {
				if (hookCtx.path !== "/sign-up/email") {
					return;
				}

				const body = hookCtx.body as Record<string, unknown> | undefined;
				const usernameValue = body?.username;

				if (typeof usernameValue !== "string" || usernameValue.trim().length === 0) {
					throw new APIError("BAD_REQUEST", {
						message: "Username is required"
					});
				}
			})
		},
		plugins: [
			convex({
				authConfig,
				jwksRotateOnTokenGenerationError: true
			}),
			organization({
				ac,
				roles: { owner, admin, member }
			}),
			username(),
			haveIBeenPwned({
				customPasswordCompromisedMessage:
					"This password appears in known breaches. Please choose a more secure password."
			})
		]
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};

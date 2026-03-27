import { createClient } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import type { GenericCtx } from '@convex-dev/better-auth/utils';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { haveIBeenPwned, organization, username } from 'better-auth/plugins';
import { v } from 'convex/values';

import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';
import { ac, admin, member, owner } from '../lib/permissions';

const isSignupsEnabled = (value: string | undefined) => {
	if (!value) {
		return true;
	}

	return !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());
};

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
	userId: v.optional(v.union(v.null(), v.string()))
});

const normalizeUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, '') || undefined;
const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const siteUrl = normalizeUrl(process.env.SITE_URL);
const betterAuthUrl = normalizeUrl(process.env.BETTER_AUTH_URL);
const baseUrl = betterAuthUrl ?? siteUrl;
const trustedOrigins = Array.from(new Set([siteUrl, betterAuthUrl].filter(isDefined)));
const signupsEnabled = isSignupsEnabled(process.env.ALLOWED_SIGNUPS);

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: baseUrl,
		trustedOrigins,
		secret: process.env.BETTER_AUTH_SECRET,
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['x-forwarded-for', 'x-real-ip']
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
				if (hookCtx.path !== '/sign-up/email') {
					return;
				}

				const body = hookCtx.body as Record<string, unknown> | undefined;
				const usernameValue = body?.username;

				if (typeof usernameValue !== 'string' || usernameValue.trim().length === 0) {
					throw new APIError('BAD_REQUEST', {
						message: 'Username is required'
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
					'This password appears in known breaches. Please choose a more secure password.'
			})
		]
	} satisfies BetterAuthOptions;
};

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};

export const getCurrentUser = query({
	args: {},
	returns: v.union(authUserValidator, v.null()),
	handler: async (ctx) => {
		return await authComponent.safeGetAuthUser(ctx);
	}
});

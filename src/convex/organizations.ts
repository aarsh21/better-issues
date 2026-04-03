import { v } from 'convex/values';

import { components } from './_generated/api';
import { query } from './_generated/server';
import { authComponent } from './betterAuth/auth';

interface Organization {
	readonly _id: string;
	readonly name: string;
	readonly slug: string;
	readonly logo?: string | null;
	readonly createdAt: number;
	readonly metadata?: string | null;
}

interface Member {
	readonly _id: string;
	readonly organizationId: string;
	readonly userId: string;
	readonly role: string;
	readonly createdAt: number;
}

const organizationSummaryValidator = v.object({
	id: v.string(),
	name: v.string(),
	slug: v.string(),
	logo: v.optional(v.union(v.null(), v.string()))
});

const resolvedOrgValidator = v.object({
	organization: organizationSummaryValidator,
	membership: v.object({
		role: v.string()
	})
});

/**
 * Resolve an organization by slug and verify the current user is a member.
 * Returns the org summary + membership role, or null if not found / not a member.
 */
export const resolveBySlug = query({
	args: { slug: v.string() },
	returns: v.union(resolvedOrgValidator, v.null()),
	handler: async (ctx, { slug }) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		const org = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'organization',
			where: [{ field: 'slug', value: slug }]
		})) as Organization | null;

		if (!org) {
			return null;
		}

		const member = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'member',
			where: [
				{ field: 'organizationId', value: org._id },
				{ field: 'userId', value: user._id }
			]
		})) as Member | null;

		if (!member) {
			return null;
		}

		return {
			organization: {
				id: org._id,
				name: org.name,
				slug: org.slug,
				logo: org.logo ?? null
			},
			membership: {
				role: member.role
			}
		};
	}
});

/**
 * List all organizations the current user belongs to.
 * Returns summaries sorted by name.
 */
export const listForCurrentUser = query({
	args: {},
	returns: v.array(organizationSummaryValidator),
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		const memberships: Member[] = [];
		let cursor: string | null = null;

		while (true) {
			const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
				model: 'member',
				where: [{ field: 'userId', value: user._id }],
				paginationOpts: { cursor, numItems: 100 }
			})) as {
				page: Member[];
				isDone: boolean;
				continueCursor: string;
			};

			memberships.push(...result.page);
			if (result.isDone) {
				break;
			}

			cursor = result.continueCursor;
		}

		if (memberships.length === 0) {
			return [];
		}

		const orgs: Array<{
			id: string;
			name: string;
			slug: string;
			logo?: string | null;
		}> = [];

		for (const m of memberships) {
			const org = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
				model: 'organization',
				where: [{ field: '_id', value: m.organizationId }]
			})) as Organization | null;

			if (org) {
				orgs.push({
					id: org._id,
					name: org.name,
					slug: org.slug,
					logo: org.logo ?? null
				});
			}
		}

		orgs.sort((a, b) => a.name.localeCompare(b.name));

		return orgs;
	}
});

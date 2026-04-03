import { v } from 'convex/values';

import { components } from './_generated/api';
import { query } from './_generated/server';

interface Invitation {
	readonly _id: string;
	readonly organizationId: string;
	readonly email: string;
	readonly role?: string | null;
	readonly status: string;
	readonly expiresAt: number;
	readonly createdAt: number;
	readonly inviterId: string;
}

interface Organization {
	readonly _id: string;
	readonly name: string;
	readonly slug: string;
}

const invitationSummaryValidator = v.object({
	id: v.string(),
	status: v.string(),
	role: v.optional(v.union(v.null(), v.string())),
	expiresAt: v.number(),
	organizationName: v.optional(v.string())
});

/**
 * Look up a public invitation summary by ID.
 * Does NOT require authentication — used for the invite landing page
 * so signed-out users can see what they're being invited to.
 */
export const getSummary = query({
	args: { invitationId: v.string() },
	returns: v.union(invitationSummaryValidator, v.null()),
	handler: async (ctx, { invitationId }) => {
		const invitation = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'invitation',
			where: [{ field: '_id', value: invitationId }]
		})) as Invitation | null;

		if (!invitation) {
			return null;
		}

		let organizationName: string | undefined;
		const org = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'organization',
			where: [{ field: '_id', value: invitation.organizationId }]
		})) as Organization | null;

		if (org) {
			organizationName = org.name;
		}

		const status =
			invitation.status === 'pending' && invitation.expiresAt <= Date.now()
				? 'expired'
				: invitation.status;

		return {
			id: invitation._id,
			status,
			role: invitation.role ?? null,
			expiresAt: invitation.expiresAt,
			organizationName
		};
	}
});

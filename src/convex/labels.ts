import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

import { ConvexError, v } from 'convex/values';

import { authComponent } from './auth';
import { internalMutation, mutation, query } from './_generated/server';
import { requireOrgMembership, requirePermission } from './lib/permissions';

const normalizeLabelName = (name: string) => name.trim().toLowerCase();

/**
 * Check if a normalized label name already exists for an org, optionally
 * excluding a specific label (for update checks).
 */
async function isLabelNameTaken(
	ctx: QueryCtx | MutationCtx,
	organizationId: string,
	normalizedName: string,
	excludeLabelId?: Id<'labels'>
): Promise<boolean> {
	// Try the composite index first (works for labels with normalizedName set)
	const byIndex = await ctx.db
		.query('labels')
		.withIndex('by_org_normalized_name', (q) =>
			q.eq('organizationId', organizationId).eq('normalizedName', normalizedName)
		)
		.first();

	if (byIndex && byIndex._id !== excludeLabelId) {
		return true;
	}

	// Fall back to scanning for legacy labels without normalizedName
	const orgLabels = await ctx.db
		.query('labels')
		.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
		.collect();

	return orgLabels.some(
		(label) =>
			label._id !== excludeLabelId &&
			label.name.toLowerCase() === normalizedName
	);
}

const DEFAULT_LABELS: ReadonlyArray<{
	readonly name: string;
	readonly color: string;
	readonly description?: string;
}> = [
	{ name: 'bug', color: '#ef4444', description: 'Something is not working' },
	{ name: 'documentation', color: '#3b82f6', description: 'Improvements or additions to docs' },
	{ name: 'duplicate', color: '#6b7280', description: 'This issue or pull request already exists' },
	{ name: 'enhancement', color: '#22c55e', description: 'New feature or request' },
	{ name: 'good first issue', color: '#7057ff', description: 'Good for newcomers' },
	{ name: 'help wanted', color: '#06b6d4', description: 'Extra attention is needed' },
	{ name: 'invalid', color: '#eab308', description: 'This does not seem right' },
	{ name: 'question', color: '#d876e3', description: 'Further information is requested' },
	{ name: 'wontfix', color: '#1e293b', description: 'This will not be worked on' }
];

const MAX_LABELS_PER_ORGANIZATION = 15;

async function seedDefaultLabelsForOrganization(
	ctx: MutationCtx,
	organizationId: string
): Promise<number> {
	const existing = await ctx.db
		.query('labels')
		.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
		.collect();

	const existingNames = new Set(existing.map((label) => label.name.toLowerCase()));
	const availableSlots = Math.max(0, MAX_LABELS_PER_ORGANIZATION - existing.length);
	const labelsToInsert = DEFAULT_LABELS.filter(
		(label) => !existingNames.has(label.name.toLowerCase())
	).slice(0, availableSlots);

	await Promise.all(
		labelsToInsert.map((label) =>
			ctx.db.insert('labels', {
				organizationId,
				name: label.name,
				normalizedName: normalizeLabelName(label.name),
				color: label.color,
				description: label.description
			})
		)
	);

	return labelsToInsert.length;
}

const labelValidator = v.object({
	_id: v.id('labels'),
	_creationTime: v.number(),
	organizationId: v.string(),
	name: v.string(),
	normalizedName: v.optional(v.string()),
	color: v.string(),
	description: v.optional(v.string())
});

export const list = query({
	args: {
		organizationId: v.string()
	},
	returns: v.array(labelValidator),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		await requireOrgMembership(ctx, user._id, args.organizationId);

		return await ctx.db
			.query('labels')
			.withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
			.collect();
	}
});

export const create = mutation({
	args: {
		organizationId: v.string(),
		name: v.string(),
		color: v.string(),
		description: v.optional(v.string())
	},
	returns: v.id('labels'),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requirePermission(ctx, user._id, args.organizationId, 'label', 'create');

		const trimmedName = args.name.trim();
		if (!trimmedName) {
			throw new ConvexError('Label name is required');
		}

		const existing = await ctx.db
			.query('labels')
			.withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
			.collect();

		if (existing.length >= MAX_LABELS_PER_ORGANIZATION) {
			throw new ConvexError('Maximum of 15 labels per organization');
		}

		const normalized = normalizeLabelName(trimmedName);
		if (await isLabelNameTaken(ctx, args.organizationId, normalized)) {
			throw new ConvexError('A label with this name already exists');
		}

		return await ctx.db.insert('labels', {
			organizationId: args.organizationId,
			name: trimmedName,
			normalizedName: normalized,
			color: args.color,
			description: args.description?.trim()
		});
	}
});

export const seedDefaultsForOrganization = internalMutation({
	args: {
		organizationId: v.string()
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		return await seedDefaultLabelsForOrganization(ctx, args.organizationId);
	}
});

export const ensureDefaults = mutation({
	args: {
		organizationId: v.string()
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);

		return await seedDefaultLabelsForOrganization(ctx, args.organizationId);
	}
});

export const update = mutation({
	args: {
		labelId: v.id('labels'),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
		description: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const label = await ctx.db.get(args.labelId);
		if (!label) throw new ConvexError('Label not found');
		await requirePermission(ctx, user._id, label.organizationId, 'label', 'update');

		const updates: Record<string, unknown> = {};
		if (args.name !== undefined) {
			const trimmedName = args.name.trim();
			if (!trimmedName) throw new ConvexError('Label name cannot be empty');

			const normalized = normalizeLabelName(trimmedName);
			if (await isLabelNameTaken(ctx, label.organizationId, normalized, args.labelId)) {
				throw new ConvexError('A label with this name already exists');
			}

			updates.name = trimmedName;
			updates.normalizedName = normalized;
		}
		if (args.color !== undefined) updates.color = args.color;
		if (args.description !== undefined) updates.description = args.description?.trim();

		await ctx.db.patch(args.labelId, updates);
		return null;
	}
});

export const remove = mutation({
	args: {
		labelId: v.id('labels')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const label = await ctx.db.get(args.labelId);
		if (!label) throw new ConvexError('Label not found');
		await requirePermission(ctx, user._id, label.organizationId, 'label', 'delete');

		// Check for any issue that references this label. We use a paginated
		// scan to avoid reading the entire org in one go, bailing as soon as
		// a reference is found.
		let cursor: string | null = null;
		let done = false;
		const BATCH = 200;

		while (!done) {
			const batch = await ctx.db
				.query('issues')
				.withIndex('by_organization', (q) => q.eq('organizationId', label.organizationId))
				.paginate({ cursor, numItems: BATCH });

			for (const issue of batch.page) {
				if (issue.labelIds.includes(args.labelId)) {
					throw new ConvexError(
						'This label is still used by existing issues. Remove it from those issues before deleting the label.'
					);
				}
			}

			done = batch.isDone;
			cursor = batch.continueCursor;
		}

		await ctx.db.delete(args.labelId);
		return null;
	}
});

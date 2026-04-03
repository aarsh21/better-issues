import type { Doc } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

import { ConvexError, v } from 'convex/values';

import { authComponent } from './auth';
import { mutation, query } from './_generated/server';
import { requireOrgMembership, requirePermission } from './lib/permissions';
import { parseTemplateSchema } from './lib/templateSchema';

const templateValidator = v.object({
	_id: v.id('issueTemplates'),
	_creationTime: v.number(),
	organizationId: v.string(),
	name: v.string(),
	description: v.string(),
	schema: v.string(),
	createdBy: v.string(),
	createdAt: v.number()
});

/**
 * Snapshot template name/schema into linked issues that don't already have
 * them, and optionally clear the templateId reference.
 *
 * Processes in batches to avoid hitting mutation write limits on large orgs.
 */
async function snapshotTemplateIssues(
	ctx: MutationCtx,
	template: Pick<Doc<'issueTemplates'>, '_id' | 'organizationId' | 'name' | 'schema'>,
	clearTemplateId: boolean
) {
	const BATCH = 200;
	let cursor: string | null = null;
	let done = false;

	while (!done) {
		const batch = await ctx.db
			.query('issues')
			.withIndex('by_organization_and_templateId', (q) =>
				q.eq('organizationId', template.organizationId).eq('templateId', template._id)
			)
			.paginate({ cursor, numItems: BATCH });

		await Promise.all(
			batch.page.map(async (issue) => {
				const updates: {
					templateId?: undefined;
					templateNameSnapshot?: string;
					templateSchemaSnapshot?: string;
				} = {};

				if (!issue.templateNameSnapshot) {
					updates.templateNameSnapshot = template.name;
				}
				if (!issue.templateSchemaSnapshot) {
					updates.templateSchemaSnapshot = template.schema;
				}
				if (clearTemplateId) {
					updates.templateId = undefined;
				}

				if (Object.keys(updates).length === 0) {
					return;
				}

				await ctx.db.patch(issue._id, updates);
			})
		);

		done = batch.isDone;
		cursor = batch.continueCursor;
	}
}

export const list = query({
	args: {
		organizationId: v.string()
	},
	returns: v.array(templateValidator),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		await requireOrgMembership(ctx, user._id, args.organizationId);

		return await ctx.db
			.query('issueTemplates')
			.withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
			.collect();
	}
});

export const get = query({
	args: {
		templateId: v.id('issueTemplates')
	},
	returns: v.union(templateValidator, v.null()),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return null;

		const template = await ctx.db.get(args.templateId);
		if (!template) return null;
		await requireOrgMembership(ctx, user._id, template.organizationId);
		return template;
	}
});

export const create = mutation({
	args: {
		organizationId: v.string(),
		name: v.string(),
		description: v.string(),
		schema: v.string()
	},
	returns: v.id('issueTemplates'),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requirePermission(ctx, user._id, args.organizationId, 'template', 'create');

		if (!args.name.trim()) {
			throw new ConvexError('Template name is required');
		}

		try {
			parseTemplateSchema(args.schema);
		} catch (error) {
			throw new ConvexError(
				`Invalid template schema: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		return await ctx.db.insert('issueTemplates', {
			organizationId: args.organizationId,
			name: args.name.trim(),
			description: args.description.trim(),
			schema: args.schema,
			createdBy: user._id,
			createdAt: Date.now()
		});
	}
});

export const update = mutation({
	args: {
		templateId: v.id('issueTemplates'),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		schema: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const template = await ctx.db.get(args.templateId);
		if (!template) throw new ConvexError('Template not found');
		await requirePermission(ctx, user._id, template.organizationId, 'template', 'update');

		const updates: Record<string, unknown> = {};
		if (args.name !== undefined) {
			if (!args.name.trim()) throw new ConvexError('Template name cannot be empty');
			updates.name = args.name.trim();
		}
		if (args.description !== undefined) updates.description = args.description.trim();
		if (args.schema !== undefined) {
			try {
				parseTemplateSchema(args.schema);
			} catch (error) {
				throw new ConvexError(
					`Invalid template schema: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
			updates.schema = args.schema;
		}

		if (args.name !== undefined || args.schema !== undefined) {
			await snapshotTemplateIssues(ctx, template, false);
		}

		await ctx.db.patch(args.templateId, updates);
		return null;
	}
});

export const remove = mutation({
	args: {
		templateId: v.id('issueTemplates')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const template = await ctx.db.get(args.templateId);
		if (!template) throw new ConvexError('Template not found');
		await requirePermission(ctx, user._id, template.organizationId, 'template', 'delete');
		await snapshotTemplateIssues(ctx, template, true);

		await ctx.db.delete(args.templateId);
		return null;
	}
});

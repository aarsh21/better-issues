import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

import { ConvexError, v } from 'convex/values';

import {
	authComponent,
	createAttachmentUploadToken,
	createAvatarUploadToken,
	createProfileImageReference,
	resolveAttachmentUploadToken,
	resolveAvatarUploadToken
} from './auth';
import { mutation, query } from './_generated/server';
import { deleteAttachmentClaims } from './lib/attachments';
import { collectTemplateStorageIds } from './lib/issueTemplateFiles';
import { requireOrgMembership, requirePermission } from './lib/permissions';

const MAX_AVATAR_UPLOAD_TOKEN_AGE_MS = 15 * 60 * 1_000;
const MAX_ATTACHMENT_UPLOAD_TOKEN_AGE_MS = 15 * 60 * 1_000;

const collectIssueStorageIds = (
	issue: Doc<'issues'>,
	template: Doc<'issueTemplates'> | null
): Set<Id<'_storage'>> => {
	const templateSchemaJson = issue.templateSchemaSnapshot ?? template?.schema;
	return collectTemplateStorageIds(templateSchemaJson, issue.templateData);
};

async function getIssueStorageIds(
	ctx: QueryCtx | MutationCtx,
	issueId: Id<'issues'>,
	organizationId: string
): Promise<Set<Id<'_storage'>>> {
	const issue = await ctx.db.get(issueId);
	if (!issue || issue.organizationId !== organizationId) {
		throw new ConvexError('Issue not found');
	}

	if (!issue.templateData) {
		return new Set();
	}

	if (!issue.templateId) {
		return collectIssueStorageIds(issue, null);
	}

	const template = await ctx.db.get(issue.templateId);
	if (template && template.organizationId === organizationId) {
		return collectIssueStorageIds(issue, template);
	}

	return collectIssueStorageIds(issue, null);
}

export const generateUploadUrl = mutation({
	args: {
		organizationId: v.string()
	},
	returns: v.object({
		uploadUrl: v.string(),
		uploadToken: v.string()
	}),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);

		const issuedAt = Date.now();
		const [uploadUrl, uploadToken] = await Promise.all([
			ctx.storage.generateUploadUrl(),
			createAttachmentUploadToken({
				organizationId: args.organizationId,
				userId: user._id,
				issuedAt
			})
		]);

		return { uploadUrl, uploadToken };
	}
});

/**
 * Claim an uploaded file so it can be referenced by issues/templates.
 * Must be called after a successful upload and before using the storageId.
 */
export const claimUpload = mutation({
	args: {
		organizationId: v.string(),
		storageId: v.id('_storage'),
		uploadToken: v.string()
	},
	returns: v.id('attachments'),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);

		const uploadToken = await resolveAttachmentUploadToken({
			token: args.uploadToken,
			userId: user._id,
			organizationId: args.organizationId,
			maxAgeMs: MAX_ATTACHMENT_UPLOAD_TOKEN_AGE_MS
		});
		if (!uploadToken) {
			throw new ConvexError('File upload authorization expired. Please upload again.');
		}

		const storageDoc = await ctx.db.system.get(args.storageId);
		if (!storageDoc || storageDoc._creationTime < uploadToken.issuedAt) {
			throw new ConvexError('Uploaded file not found');
		}

		const existingClaim = await ctx.db
			.query('attachments')
			.withIndex('by_storage_id', (q) => q.eq('storageId', args.storageId))
			.unique();

		if (existingClaim) {
			if (existingClaim.organizationId !== args.organizationId) {
				throw new ConvexError('Uploaded file is already claimed by another organization');
			}

			return existingClaim._id;
		}

		return await ctx.db.insert('attachments', {
			storageId: args.storageId,
			organizationId: args.organizationId,
			uploadedBy: user._id,
			claimedAt: Date.now()
		});
	}
});

export const generateAvatarUploadUrl = mutation({
	args: {
		organizationId: v.string()
	},
	returns: v.object({
		uploadUrl: v.string(),
		uploadToken: v.string()
	}),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);

		const issuedAt = Date.now();
		const [uploadUrl, uploadToken] = await Promise.all([
			ctx.storage.generateUploadUrl(),
			createAvatarUploadToken({
				organizationId: args.organizationId,
				userId: user._id,
				issuedAt
			})
		]);

		return { uploadUrl, uploadToken };
	}
});

export const getUrls = query({
	args: {
		organizationId: v.string(),
		issueId: v.id('issues'),
		storageIds: v.array(v.id('_storage'))
	},
	returns: v.array(
		v.object({
			storageId: v.id('_storage'),
			url: v.union(v.string(), v.null())
		})
	),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);
		const issueStorageIds = await getIssueStorageIds(ctx, args.issueId, args.organizationId);

		return await Promise.all(
			args.storageIds.map(async (storageId) => {
				if (!issueStorageIds.has(storageId)) {
					return { storageId, url: null };
				}

				return {
					storageId,
					url: await ctx.storage.getUrl(storageId)
				};
			})
		);
	}
});

export const createAvatarReference = mutation({
	args: {
		organizationId: v.string(),
		storageId: v.id('_storage'),
		uploadToken: v.string()
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requireOrgMembership(ctx, user._id, args.organizationId);

		const uploadToken = await resolveAvatarUploadToken({
			token: args.uploadToken,
			userId: user._id,
			organizationId: args.organizationId,
			maxAgeMs: MAX_AVATAR_UPLOAD_TOKEN_AGE_MS
		});
		if (!uploadToken) {
			throw new ConvexError('Avatar upload authorization expired. Please upload again.');
		}

		const storageDocument = await ctx.db.system.get(args.storageId);
		if (!storageDocument || storageDocument._creationTime < uploadToken.issuedAt) {
			throw new ConvexError('Invalid avatar file. Please upload a new image.');
		}

		return await createProfileImageReference({
			organizationId: args.organizationId,
			storageId: args.storageId,
			userId: user._id
		});
	}
});

export const remove = mutation({
	args: {
		organizationId: v.string(),
		issueId: v.id('issues'),
		storageId: v.id('_storage')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');
		await requirePermission(ctx, user._id, args.organizationId, 'issue', 'update');
		const issueStorageIds = await getIssueStorageIds(ctx, args.issueId, args.organizationId);
		if (!issueStorageIds.has(args.storageId)) {
			throw new ConvexError('File not found');
		}

		await ctx.storage.delete(args.storageId);
		await deleteAttachmentClaims(ctx, args.organizationId, new Set([args.storageId]));
		return null;
	}
});

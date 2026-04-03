import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	attachments: defineTable({
		storageId: v.id('_storage'),
		organizationId: v.string(),
		uploadedBy: v.string(),
		claimedAt: v.number()
	})
		.index('by_storage_id', ['storageId'])
		.index('by_organization', ['organizationId'])
		.index('by_org_and_storage', ['organizationId', 'storageId']),

	labels: defineTable({
		organizationId: v.string(),
		name: v.string(),
		normalizedName: v.optional(v.string()),
		color: v.string(),
		description: v.optional(v.string())
	})
		.index('by_organization', ['organizationId'])
		.index('by_org_normalized_name', ['organizationId', 'normalizedName']),

	issueTemplates: defineTable({
		organizationId: v.string(),
		name: v.string(),
		description: v.string(),
		schema: v.string(),
		createdBy: v.string(),
		createdAt: v.number()
	}).index('by_organization', ['organizationId']),

	issues: defineTable({
		organizationId: v.string(),
		number: v.number(),
		title: v.string(),
		description: v.optional(v.string()),
		status: v.union(v.literal('open'), v.literal('in_progress'), v.literal('closed')),
		priority: v.union(
			v.literal('low'),
			v.literal('medium'),
			v.literal('high'),
			v.literal('urgent')
		),
		assigneeId: v.optional(v.string()),
		labelIds: v.array(v.id('labels')),
		createdBy: v.string(),
		templateId: v.optional(v.id('issueTemplates')),
		templateNameSnapshot: v.optional(v.string()),
		templateSchemaSnapshot: v.optional(v.string()),
		templateData: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
		closedAt: v.optional(v.number())
	})
		.index('by_organization', ['organizationId'])
		.index('by_organization_and_templateId', ['organizationId', 'templateId'])
		.index('by_org_and_status', ['organizationId', 'status'])
		.index('by_org_and_number', ['organizationId', 'number'])
		.index('by_org_and_priority', ['organizationId', 'priority'])
		.index('by_assignee', ['organizationId', 'assigneeId'])
		.index('by_org_assignee_status', ['organizationId', 'assigneeId', 'status'])
		.searchIndex('search_issues', {
			searchField: 'title',
			filterFields: ['organizationId', 'status']
		})
});

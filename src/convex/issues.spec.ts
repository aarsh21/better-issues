import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireOrgMembership: vi.fn(),
	requirePermission: vi.fn(),
	safeGetAuthUser: vi.fn()
}));

vi.mock('./auth', async () => {
	const actual = await vi.importActual<typeof import('./auth')>('./auth');

	return {
		...actual,
		authComponent: {
			safeGetAuthUser: mocks.safeGetAuthUser
		}
	};
});

vi.mock('./lib/permissions', async () => {
	const actual = await vi.importActual<typeof import('./lib/permissions')>('./lib/permissions');

	return {
		...actual,
		requireOrgMembership: mocks.requireOrgMembership,
		requirePermission: mocks.requirePermission
	};
});

import { api } from './_generated/api';
import { createConvexTest } from '../test/convex';

describe('issues functions', () => {
	beforeEach(() => {
		mocks.safeGetAuthUser.mockReset();
		mocks.requireOrgMembership.mockReset();
		mocks.requirePermission.mockReset();
		mocks.safeGetAuthUser.mockResolvedValue({ _id: 'user_1' });
		mocks.requireOrgMembership.mockResolvedValue({
			_id: 'member_1',
			organizationId: 'org_1',
			userId: 'user_1',
			role: 'admin',
			createdAt: 1
		});
		mocks.requirePermission.mockResolvedValue({
			_id: 'member_1',
			organizationId: 'org_1',
			userId: 'user_1',
			role: 'admin',
			createdAt: 1
		});
	});

	it('creates an issue with trimmed fields and increments the issue number', async () => {
		const t = createConvexTest();
		const labelId = await t.run((ctx) =>
			ctx.db.insert('labels', {
				organizationId: 'org_1',
				name: 'bug',
				color: '#ef4444'
			})
		);

		const first = await t.mutation(api.issues.create, {
			organizationId: 'org_1',
			title: '  Fix sidebar  ',
			description: '  Repro in settings  ',
			priority: 'high',
			labelIds: [labelId]
		});
		const second = await t.mutation(api.issues.create, {
			organizationId: 'org_1',
			title: 'Second issue',
			priority: 'low',
			labelIds: []
		});
		const storedIssue = await t.run((ctx) => ctx.db.get(first.issueId));

		expect(first.number).toBe(1);
		expect(second.number).toBe(2);
		expect(storedIssue).toMatchObject({
			title: 'Fix sidebar',
			description: 'Repro in settings',
			status: 'open',
			priority: 'high',
			labelIds: [labelId],
			createdBy: 'user_1'
		});
	});

	it('captures template snapshots when creating an issue from a template', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident template',
				schema: JSON.stringify({
					fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
				}),
				createdBy: 'user_1',
				createdAt: 1
			})
		);

		const created = await t.mutation(api.issues.create, {
			organizationId: 'org_1',
			title: 'Payment outage',
			priority: 'urgent',
			labelIds: [],
			templateId,
			templateData: JSON.stringify({
				impact: 'Checkout unavailable'
			})
		});
		const storedIssue = await t.run((ctx) => ctx.db.get(created.issueId));

		expect(storedIssue).toMatchObject({
			templateId,
			templateNameSnapshot: 'Incident report',
			templateSchemaSnapshot: JSON.stringify({
				fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
			}),
			templateData: JSON.stringify({
				impact: 'Checkout unavailable'
			})
		});
	});

	it('rejects template data when no template is selected', async () => {
		const t = createConvexTest();

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Unstructured data',
				priority: 'medium',
				labelIds: [],
				templateData: JSON.stringify({
					impact: 'Should fail'
				})
			})
		).rejects.toThrow('Template data provided without template');
	});

	it('lists issues for members and applies a status filter', async () => {
		const t = createConvexTest();

		await t.run(async (ctx) => {
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Open issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			});
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 2,
				title: 'Closed issue',
				status: 'closed',
				priority: 'high',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 2,
				updatedAt: 2,
				closedAt: 2
			});
		});

		const result = await t.query(api.issues.list, {
			organizationId: 'org_1',
			status: 'closed',
			paginationOpts: {
				cursor: null,
				numItems: 10
			}
		});

		expect(result.page).toHaveLength(1);
		expect(result.page[0]).toMatchObject({
			number: 2,
			status: 'closed',
			title: 'Closed issue'
		});
	});

	it('updates status and clears closedAt when reopening an issue', async () => {
		const t = createConvexTest();
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Needs triage',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.issues.updateStatus, {
			issueId,
			status: 'closed'
		});

		let storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		expect(storedIssue?.status).toBe('closed');
		expect(storedIssue?.closedAt).toEqual(expect.any(Number));

		await t.mutation(api.issues.updateStatus, {
			issueId,
			status: 'open'
		});

		storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		expect(storedIssue?.status).toBe('open');
		expect(storedIssue?.closedAt).toBeUndefined();
	});

	it('returns an empty result when listing issues without an authenticated user', async () => {
		const t = createConvexTest();
		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		const result = await t.query(api.issues.list, {
			organizationId: 'org_1',
			paginationOpts: {
				cursor: null,
				numItems: 10
			}
		});

		expect(result).toEqual({
			page: [],
			isDone: true,
			continueCursor: '',
			splitCursor: null,
			pageStatus: null
		});
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('filters assignee-backed issue lists by status and label', async () => {
		const t = createConvexTest();
		const bugLabelId = await t.run((ctx) =>
			ctx.db.insert('labels', {
				organizationId: 'org_1',
				name: 'bug',
				color: '#ef4444'
			})
		);
		const choreLabelId = await t.run((ctx) =>
			ctx.db.insert('labels', {
				organizationId: 'org_1',
				name: 'chore',
				color: '#22c55e'
			})
		);

		await t.run(async (ctx) => {
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Assigned open issue',
				status: 'open',
				priority: 'medium',
				assigneeId: 'user_2',
				labelIds: [bugLabelId],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			});
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 2,
				title: 'Assigned closed issue',
				status: 'closed',
				priority: 'medium',
				assigneeId: 'user_2',
				labelIds: [bugLabelId],
				createdBy: 'user_1',
				createdAt: 2,
				updatedAt: 2
			});
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 3,
				title: 'Wrong label issue',
				status: 'open',
				priority: 'medium',
				assigneeId: 'user_2',
				labelIds: [choreLabelId],
				createdBy: 'user_1',
				createdAt: 3,
				updatedAt: 3
			});
		});

		const result = await t.query(api.issues.list, {
			organizationId: 'org_1',
			assigneeId: 'user_2',
			status: 'open',
			labelId: bugLabelId,
			paginationOpts: {
				cursor: null,
				numItems: 10
			}
		});

		expect(result.page).toHaveLength(1);
		expect(result.page[0]).toMatchObject({
			number: 1,
			title: 'Assigned open issue',
			status: 'open',
			labelIds: [bugLabelId]
		});
	});

	it('searches issues by title and returns no results for blank searches', async () => {
		const t = createConvexTest();

		await t.run(async (ctx) => {
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Checkout outage',
				status: 'closed',
				priority: 'urgent',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			});
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 2,
				title: 'Sidebar polish',
				status: 'open',
				priority: 'low',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 2,
				updatedAt: 2
			});
		});

		await expect(
			t.query(api.issues.search, {
				organizationId: 'org_1',
				searchQuery: '   '
			})
		).resolves.toEqual([]);

		const result = await t.query(api.issues.search, {
			organizationId: 'org_1',
			searchQuery: 'Checkout',
			status: 'closed'
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			number: 1,
			title: 'Checkout outage',
			status: 'closed'
		});
	});

	it('gets issues by their organization-scoped number', async () => {
		const t = createConvexTest();
		await t.run(async (ctx) => {
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 9,
				title: 'Scoped issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			});
		});

		const issue = await t.query(api.issues.getByNumber, {
			organizationId: 'org_1',
			number: 9
		});
		const missing = await t.query(api.issues.getByNumber, {
			organizationId: 'org_1',
			number: 99
		});

		expect(issue).toMatchObject({
			number: 9,
			title: 'Scoped issue'
		});
		expect(missing).toBeNull();
	});

	it('rejects invalid template payloads during issue creation', async () => {
		const t = createConvexTest();
		const validTemplateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident template',
				schema: JSON.stringify({
					fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
				}),
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const foreignTemplateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_2',
				name: 'Foreign template',
				description: 'Wrong organization',
				schema: JSON.stringify({ fields: [] }),
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const brokenTemplateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Broken template',
				description: 'Bad schema',
				schema: '{"fields":[',
				createdBy: 'user_1',
				createdAt: 1
			})
		);

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Invalid json',
				priority: 'medium',
				labelIds: [],
				templateId: validTemplateId,
				templateData: '{'
			})
		).rejects.toThrow('Invalid template data');

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Wrong payload shape',
				priority: 'medium',
				labelIds: [],
				templateId: validTemplateId,
				templateData: '"nope"'
			})
		).rejects.toThrow('Template data must be an object');

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Missing required field',
				priority: 'medium',
				labelIds: [],
				templateId: validTemplateId,
				templateData: JSON.stringify({})
			})
		).rejects.toThrow('Impact is required');

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Foreign template',
				priority: 'medium',
				labelIds: [],
				templateId: foreignTemplateId
			})
		).rejects.toThrow('Template not found');

		await expect(
			t.mutation(api.issues.create, {
				organizationId: 'org_1',
				title: 'Broken template',
				priority: 'medium',
				labelIds: [],
				templateId: brokenTemplateId
			})
		).rejects.toThrow('Invalid template schema');
	});

	it('updates issue metadata and clears an assignee when null is provided', async () => {
		const t = createConvexTest();
		const labelId = await t.run((ctx) =>
			ctx.db.insert('labels', {
				organizationId: 'org_1',
				name: 'bug',
				color: '#ef4444'
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 4,
				title: 'Old title',
				description: 'Old description',
				status: 'open',
				priority: 'low',
				assigneeId: 'user_2',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.issues.update, {
			issueId,
			title: '  New title  ',
			description: '  New description  ',
			priority: 'urgent',
			assigneeId: null,
			labelIds: [labelId]
		});

		const issue = await t.run((ctx) => ctx.db.get(issueId));

		expect(issue).toMatchObject({
			title: 'New title',
			description: 'New description',
			priority: 'urgent',
			labelIds: [labelId]
		});
		expect(issue?.assigneeId).toBeUndefined();
		expect(issue?.updatedAt).toBeGreaterThan(1);
	});

	it('rejects issue updates when the record is missing or invalid', async () => {
		const t = createConvexTest();
		const labelId = await t.run((ctx) =>
			ctx.db.insert('labels', {
				organizationId: 'org_2',
				name: 'foreign',
				color: '#22c55e'
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 5,
				title: 'Old title',
				status: 'open',
				priority: 'low',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			})
		);

		await expect(
			t.mutation(api.issues.update, {
				issueId,
				title: '   '
			})
		).rejects.toThrow('Title cannot be empty');

		await expect(
			t.mutation(api.issues.update, {
				issueId,
				labelIds: [labelId]
			})
		).rejects.toThrow('One or more labels are invalid for this organization');

		await t.run((ctx) => ctx.db.delete(issueId));

		await expect(
			t.mutation(api.issues.update, {
				issueId,
				title: 'Still missing'
			})
		).rejects.toThrow('Issue not found');
	});

	it('returns early when updating an issue status to the same value', async () => {
		const t = createConvexTest();
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 6,
				title: 'No-op status change',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.issues.updateStatus, {
			issueId,
			status: 'open'
		});

		const issue = await t.run((ctx) => ctx.db.get(issueId));
		expect(issue).toMatchObject({
			status: 'open',
			updatedAt: 1
		});
		expect(issue?.closedAt).toBeUndefined();
	});

	it('removes issues and deletes any referenced template files', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['attachment'], { type: 'text/plain' }))
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 7,
				title: 'Attachment issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				templateSchemaSnapshot: JSON.stringify({
					fields: [
						{
							key: 'attachment',
							label: 'Attachment',
							type: 'file',
							required: false,
							multiple: false
						}
					]
				}),
				templateData: JSON.stringify({
					attachment: {
						storageId,
						fileName: 'attachment.txt',
						fileType: 'text/plain',
						fileSize: 10
					}
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.issues.remove, {
			issueId
		});

		const issue = await t.run((ctx) => ctx.db.get(issueId));
		const deletedUrl = await t.run((ctx) => ctx.storage.getUrl(storageId));

		expect(issue).toBeNull();
		expect(deletedUrl).toBeNull();
	});
});

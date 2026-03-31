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

describe('templates functions', () => {
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

	it('returns an empty list when templates are requested without an authenticated user', async () => {
		const t = createConvexTest();

		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		const templates = await t.query(api.templates.list, {
			organizationId: 'org_1'
		});

		expect(templates).toEqual([]);
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('creates a template with trimmed metadata', async () => {
		const t = createConvexTest();

		const templateId = await t.mutation(api.templates.create, {
			organizationId: 'org_1',
			name: '  Incident report  ',
			description: '  Structured incident workflow  ',
			schema: JSON.stringify({
				fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
			})
		});
		const template = await t.query(api.templates.get, { templateId });

		expect(template).toMatchObject({
			_id: templateId,
			name: 'Incident report',
			description: 'Structured incident workflow',
			createdBy: 'user_1'
		});
	});

	it('rejects invalid template creation input', async () => {
		const t = createConvexTest();

		await expect(
			t.mutation(api.templates.create, {
				organizationId: 'org_1',
				name: '   ',
				description: 'Structured incident workflow',
				schema: JSON.stringify({ fields: [] })
			})
		).rejects.toThrow('Template name is required');

		await expect(
			t.mutation(api.templates.create, {
				organizationId: 'org_1',
				name: 'Broken template',
				description: 'Structured incident workflow',
				schema: '{"fields":'
			})
		).rejects.toThrow('Invalid template schema');
	});

	it('returns null when fetching a missing template', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Template',
				description: 'Description',
				schema: JSON.stringify({ fields: [] }),
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		await t.run((ctx) => ctx.db.delete(templateId));

		const template = await t.query(api.templates.get, {
			templateId
		});

		expect(template).toBeNull();
	});

	it('snapshots linked issue data when the template changes', async () => {
		const t = createConvexTest();
		const originalSchema = JSON.stringify({
			fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
		});
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: originalSchema,
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 7,
				title: 'Checkout outage',
				status: 'open',
				priority: 'urgent',
				labelIds: [],
				createdBy: 'user_1',
				templateId,
				templateData: JSON.stringify({
					impact: 'Checkout unavailable'
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);
		const updatedSchema = JSON.stringify({
			fields: [{ key: 'impact', label: 'Customer impact', type: 'text', required: true }]
		});

		await t.mutation(api.templates.update, {
			templateId,
			name: 'Updated incident report',
			schema: updatedSchema
		});

		const storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		const storedTemplate = await t.query(api.templates.get, { templateId });

		expect(storedIssue).toMatchObject({
			templateNameSnapshot: 'Incident report',
			templateSchemaSnapshot: originalSchema
		});
		expect(storedTemplate).toMatchObject({
			name: 'Updated incident report',
			schema: updatedSchema
		});
	});

	it('updates template descriptions without touching existing issue snapshots', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: JSON.stringify({
					fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
				}),
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 9,
				title: 'Checkout outage',
				status: 'open',
				priority: 'urgent',
				labelIds: [],
				createdBy: 'user_1',
				templateId,
				templateData: JSON.stringify({
					impact: 'Checkout unavailable'
				}),
				templateNameSnapshot: 'Existing snapshot',
				templateSchemaSnapshot: JSON.stringify({
					fields: [{ key: 'impact', label: 'Existing impact', type: 'text', required: true }]
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.templates.update, {
			templateId,
			description: '  Updated workflow  '
		});

		const storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		const storedTemplate = await t.query(api.templates.get, { templateId });

		expect(storedTemplate).toMatchObject({
			description: 'Updated workflow'
		});
		expect(storedIssue).toMatchObject({
			templateNameSnapshot: 'Existing snapshot'
		});
	});

	it('rejects invalid template updates and removals', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: JSON.stringify({
					fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
				}),
				createdBy: 'user_1',
				createdAt: 1
			})
		);

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				name: '   '
			})
		).rejects.toThrow('Template name cannot be empty');

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				schema: '{"fields":'
			})
		).rejects.toThrow('Invalid template schema');

		await t.run((ctx) => ctx.db.delete(templateId));

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				name: 'Missing template'
			})
		).rejects.toThrow('Template not found');

		await expect(
			t.mutation(api.templates.remove, {
				templateId
			})
		).rejects.toThrow('Template not found');
	});

	it('clears templateId but keeps snapshots when a template is removed', async () => {
		const t = createConvexTest();
		const schemaJson = JSON.stringify({
			fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
		});
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: schemaJson,
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 8,
				title: 'Search outage',
				status: 'open',
				priority: 'high',
				labelIds: [],
				createdBy: 'user_1',
				templateId,
				templateData: JSON.stringify({
					impact: 'Search unavailable'
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.templates.remove, {
			templateId
		});

		const storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		const storedTemplate = await t.run((ctx) => ctx.db.get(templateId));

		expect(storedTemplate).toBeNull();
		expect(storedIssue?.templateId).toBeUndefined();
		expect(storedIssue).toMatchObject({
			templateNameSnapshot: 'Incident report',
			templateSchemaSnapshot: schemaJson
		});
	});

	it('returns an empty list for unauthenticated users', async () => {
		const t = createConvexTest();
		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		await expect(
			t.query(api.templates.list, {
				organizationId: 'org_1'
			})
		).resolves.toEqual([]);
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('returns null for a missing template and rejects unauthenticated reads', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Template',
				description: 'Description',
				schema: JSON.stringify({ fields: [] }),
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		await t.run((ctx) => ctx.db.delete(templateId));

		const missing = await t.query(api.templates.get, { templateId });

		expect(missing).toBeNull();

		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		await expect(
			t.query(api.templates.get, {
				templateId
			})
		).rejects.toThrow('Not authenticated');
	});

	it('rejects invalid template creation requests', async () => {
		const t = createConvexTest();

		await expect(
			t.mutation(api.templates.create, {
				organizationId: 'org_1',
				name: '   ',
				description: 'Description',
				schema: JSON.stringify({ fields: [] })
			})
		).rejects.toThrow('Template name is required');

		await expect(
			t.mutation(api.templates.create, {
				organizationId: 'org_1',
				name: 'Broken template',
				description: 'Description',
				schema: '{"fields":['
			})
		).rejects.toThrow('Invalid template schema');
	});

	it('updates description-only changes without snapshotting linked issues', async () => {
		const t = createConvexTest();
		const schemaJson = JSON.stringify({
			fields: [{ key: 'impact', label: 'Impact', type: 'text', required: true }]
		});
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: schemaJson,
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 9,
				title: 'Search outage',
				status: 'open',
				priority: 'high',
				labelIds: [],
				createdBy: 'user_1',
				templateId,
				templateData: JSON.stringify({
					impact: 'Search unavailable'
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);

		await t.mutation(api.templates.update, {
			templateId,
			description: '  Refined description  '
		});

		const storedIssue = await t.run((ctx) => ctx.db.get(issueId));
		const storedTemplate = await t.query(api.templates.get, { templateId });

		expect(storedTemplate?.description).toBe('Refined description');
		expect(storedIssue?.templateNameSnapshot).toBeUndefined();
		expect(storedIssue?.templateSchemaSnapshot).toBeUndefined();
	});

	it('rejects invalid template updates and deletes', async () => {
		const t = createConvexTest();
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: JSON.stringify({ fields: [] }),
				createdBy: 'user_1',
				createdAt: 1
			})
		);

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				name: '   '
			})
		).rejects.toThrow('Template name cannot be empty');

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				schema: '{"fields":['
			})
		).rejects.toThrow('Invalid template schema');

		await t.run((ctx) => ctx.db.delete(templateId));

		await expect(
			t.mutation(api.templates.update, {
				templateId,
				name: 'Updated'
			})
		).rejects.toThrow('Template not found');

		await expect(
			t.mutation(api.templates.remove, {
				templateId
			})
		).rejects.toThrow('Template not found');
	});
});

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

describe('labels functions', () => {
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

	it('creates a trimmed label', async () => {
		const t = createConvexTest();

		const labelId = await t.mutation(api.labels.create, {
			organizationId: 'org_1',
			name: '  Bug  ',
			color: '#ef4444',
			description: '  Something is broken  '
		});
		const labels = await t.query(api.labels.list, {
			organizationId: 'org_1'
		});

		expect(labelId).toBeTruthy();
		expect(labels).toHaveLength(1);
		expect(labels[0]).toMatchObject({
			color: '#ef4444',
			description: 'Something is broken',
			name: 'Bug',
			organizationId: 'org_1'
		});
	});

	it('rejects duplicate labels case-insensitively', async () => {
		const t = createConvexTest();

		await t.mutation(api.labels.create, {
			organizationId: 'org_1',
			name: 'Bug',
			color: '#ef4444'
		});

		await expect(
			t.mutation(api.labels.create, {
				organizationId: 'org_1',
				name: 'bug',
				color: '#ef4444'
			})
		).rejects.toThrow('A label with this name already exists');
	});

	it('returns an empty list when there is no authenticated user', async () => {
		const t = createConvexTest();
		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		await expect(
			t.query(api.labels.list, {
				organizationId: 'org_1'
			})
		).resolves.toEqual([]);
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('updates a label with trimmed values', async () => {
		const t = createConvexTest();

		const labelId = await t.mutation(api.labels.create, {
			organizationId: 'org_1',
			name: 'Bug',
			color: '#ef4444',
			description: 'Broken behavior'
		});

		await expect(
			t.mutation(api.labels.update, {
				labelId,
				name: '  Regression  ',
				description: '  Updated details  '
			})
		).resolves.toBeNull();

		await expect(
			t.query(api.labels.list, {
				organizationId: 'org_1'
			})
		).resolves.toEqual([
			expect.objectContaining({
				_id: labelId,
				description: 'Updated details',
				name: 'Regression'
			})
		]);
	});

	it('prevents removing a label that is still attached to an issue', async () => {
		const t = createConvexTest();

		const labelId = await t.mutation(api.labels.create, {
			organizationId: 'org_1',
			name: 'Bug',
			color: '#ef4444'
		});

		await t.run(async (ctx) => {
			await ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Broken sidebar',
				status: 'open',
				priority: 'medium',
				labelIds: [labelId],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			});
		});

		await expect(
			t.mutation(api.labels.remove, {
				labelId
			})
		).rejects.toThrow(
			'This label is still used by existing issues. Remove it from those issues before deleting the label.'
		);
	});

	it('seeds the default labels for an organization', async () => {
		const t = createConvexTest();

		const insertedCount = await t.mutation(api.labels.ensureDefaults, {
			organizationId: 'org_1'
		});
		const labels = await t.query(api.labels.list, {
			organizationId: 'org_1'
		});

		expect(insertedCount).toBeGreaterThan(0);
		expect(labels.length).toBe(insertedCount);
		expect(labels.map((label) => label.name)).toContain('bug');
	});

	it('rejects label creation once the organization reaches the label limit', async () => {
		const t = createConvexTest();

		await t.run(async (ctx) => {
			for (let index = 0; index < 15; index += 1) {
				await ctx.db.insert('labels', {
					organizationId: 'org_1',
					name: `label-${index}`,
					color: '#111111'
				});
			}
		});

		await expect(
			t.mutation(api.labels.create, {
				organizationId: 'org_1',
				name: 'Overflow',
				color: '#ef4444'
			})
		).rejects.toThrow('Maximum of 15 labels per organization');
	});
});

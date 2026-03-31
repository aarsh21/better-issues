import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	createAvatarUploadToken: vi.fn(),
	createProfileImageReference: vi.fn(),
	requireOrgMembership: vi.fn(),
	requirePermission: vi.fn(),
	resolveAvatarUploadToken: vi.fn(),
	safeGetAuthUser: vi.fn()
}));

vi.mock('./auth', async () => {
	const actual = await vi.importActual<typeof import('./auth')>('./auth');

	return {
		...actual,
		authComponent: {
			safeGetAuthUser: mocks.safeGetAuthUser
		},
		createAvatarUploadToken: mocks.createAvatarUploadToken,
		createProfileImageReference: mocks.createProfileImageReference,
		resolveAvatarUploadToken: mocks.resolveAvatarUploadToken
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

describe('files functions', () => {
	beforeEach(() => {
		mocks.safeGetAuthUser.mockReset();
		mocks.requireOrgMembership.mockReset();
		mocks.requirePermission.mockReset();
		mocks.createAvatarUploadToken.mockReset();
		mocks.createProfileImageReference.mockReset();
		mocks.resolveAvatarUploadToken.mockReset();

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
		mocks.createAvatarUploadToken.mockResolvedValue('avatar-token');
		mocks.createProfileImageReference.mockResolvedValue('storage:v1:storage_1:org_1:sig');
		mocks.resolveAvatarUploadToken.mockResolvedValue({ issuedAt: 0 });
	});

	it('returns an upload URL and avatar token for members', async () => {
		const t = createConvexTest();

		const result = await t.mutation(api.files.generateAvatarUploadUrl, {
			organizationId: 'org_1'
		});

		expect(result.uploadUrl).toContain('https://');
		expect(result.uploadToken).toBe('avatar-token');
		expect(mocks.createAvatarUploadToken).toHaveBeenCalledWith({
			issuedAt: expect.any(Number),
			organizationId: 'org_1',
			userId: 'user_1'
		});
	});

	it('returns URLs only for files referenced by the issue template data', async () => {
		const t = createConvexTest();
		const allowedStorageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['allowed'], { type: 'text/plain' }))
		);
		const otherStorageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['other'], { type: 'text/plain' }))
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 1,
				title: 'Attachment issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				templateSchemaSnapshot: JSON.stringify({
					fields: [
						{
							key: 'attachments',
							label: 'Attachments',
							type: 'file',
							required: false,
							multiple: true
						}
					]
				}),
				templateData: JSON.stringify({
					attachments: [
						{
							storageId: allowedStorageId,
							fileName: 'allowed.txt',
							fileType: 'text/plain',
							fileSize: 7
						}
					]
				}),
				createdAt: 1,
				updatedAt: 1
			})
		);

		const urls = await t.query(api.files.getUrls, {
			organizationId: 'org_1',
			issueId,
			storageIds: [allowedStorageId, otherStorageId]
		});

		expect(urls).toEqual([
			{
				storageId: allowedStorageId,
				url: expect.stringContaining('http')
			},
			{
				storageId: otherStorageId,
				url: null
			}
		]);
	});

	it('rejects avatar references when the upload authorization is expired', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);

		mocks.resolveAvatarUploadToken.mockResolvedValue(null);

		await expect(
			t.mutation(api.files.createAvatarReference, {
				organizationId: 'org_1',
				storageId,
				uploadToken: 'expired-token'
			})
		).rejects.toThrow('Avatar upload authorization expired. Please upload again.');
	});

	it('deletes a referenced issue file', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['attachment'], { type: 'text/plain' }))
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 5,
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

		await t.mutation(api.files.remove, {
			organizationId: 'org_1',
			issueId,
			storageId
		});

		const deletedUrl = await t.run((ctx) => ctx.storage.getUrl(storageId));
		expect(deletedUrl).toBeNull();
	});

	it('returns a generic upload URL for organization members', async () => {
		const t = createConvexTest();

		const uploadUrl = await t.mutation(api.files.generateUploadUrl, {
			organizationId: 'org_1'
		});

		expect(uploadUrl).toContain('https://');
	});

	it('uses the live template schema when resolving referenced file URLs', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['attachment'], { type: 'text/plain' }))
		);
		const templateId = await t.run((ctx) =>
			ctx.db.insert('issueTemplates', {
				organizationId: 'org_1',
				name: 'Incident report',
				description: 'Structured incident workflow',
				schema: JSON.stringify({
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
				createdBy: 'user_1',
				createdAt: 1
			})
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 2,
				title: 'Attachment issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				templateId,
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

		const urls = await t.query(api.files.getUrls, {
			organizationId: 'org_1',
			issueId,
			storageIds: [storageId]
		});

		expect(urls).toEqual([
			{
				storageId,
				url: expect.stringContaining('http')
			}
		]);
	});

	it('returns null URLs when an issue has no stored file references', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['attachment'], { type: 'text/plain' }))
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 3,
				title: 'No attachment issue',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'user_1',
				createdAt: 1,
				updatedAt: 1
			})
		);

		await expect(
			t.query(api.files.getUrls, {
				organizationId: 'org_1',
				issueId,
				storageIds: [storageId]
			})
		).resolves.toEqual([
			{
				storageId,
				url: null
			}
		]);
	});

	it('creates avatar references when the upload token and storage document are valid', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);

		const reference = await t.mutation(api.files.createAvatarReference, {
			organizationId: 'org_1',
			storageId,
			uploadToken: 'valid-token'
		});

		expect(reference).toBe('storage:v1:storage_1:org_1:sig');
		expect(mocks.createProfileImageReference).toHaveBeenCalledWith({
			organizationId: 'org_1',
			storageId,
			userId: 'user_1'
		});
	});

	it('rejects avatar references for stale storage documents', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);

		mocks.resolveAvatarUploadToken.mockResolvedValueOnce({
			issuedAt: Date.now() + 60_000
		});

		await expect(
			t.mutation(api.files.createAvatarReference, {
				organizationId: 'org_1',
				storageId,
				uploadToken: 'valid-token'
			})
		).rejects.toThrow('Invalid avatar file. Please upload a new image.');
	});

	it('rejects file removals when the referenced file is missing from the issue payload', async () => {
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['attachment'], { type: 'text/plain' }))
		);
		const issueId = await t.run((ctx) =>
			ctx.db.insert('issues', {
				organizationId: 'org_1',
				number: 10,
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
		const otherStorageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['other'], { type: 'text/plain' }))
		);

		await expect(
			t.mutation(api.files.remove, {
				organizationId: 'org_1',
				issueId,
				storageId: otherStorageId
			})
		).rejects.toThrow('File not found');
	});
});

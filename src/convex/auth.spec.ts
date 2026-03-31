import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireOrgMembership: vi.fn(),
	safeGetAuthUser: vi.fn()
}));

vi.mock('./betterAuth/auth', async () => {
	const actual = await vi.importActual<typeof import('./betterAuth/auth')>('./betterAuth/auth');

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
		requireOrgMembership: mocks.requireOrgMembership
	};
});

import { api } from './_generated/api';
import {
	createAvatarUploadToken,
	createProfileImageReference,
	isStorageImageReference,
	resolveAvatarUploadToken
} from './auth';
import { createConvexTest } from '../test/convex';

describe('auth helpers', () => {
	const baseUser = {
		_id: 'user_1',
		_creationTime: 1,
		name: 'Test User',
		email: 'user@example.com',
		emailVerified: true,
		image: null,
		createdAt: 1,
		updatedAt: 1
	};

	beforeEach(() => {
		mocks.safeGetAuthUser.mockReset();
		mocks.requireOrgMembership.mockReset();
		mocks.requireOrgMembership.mockResolvedValue({
			_id: 'member_1',
			organizationId: 'org_1',
			userId: 'user_1',
			role: 'member',
			createdAt: 1
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		delete process.env.BETTER_AUTH_SECRET;
		delete process.env.PROFILE_IMAGE_SIGNING_SECRET;
	});

	it('identifies storage-backed image references', () => {
		expect(isStorageImageReference('storage:v1:storage_1:org_1:sig')).toBe(true);
		expect(isStorageImageReference('https://example.com/avatar.png')).toBe(false);
		expect(isStorageImageReference(null)).toBe(false);
	});

	it('creates signed profile image references', async () => {
		process.env.PROFILE_IMAGE_SIGNING_SECRET = 'profile-secret';

		const reference = await createProfileImageReference({
			userId: 'user_1',
			organizationId: 'org_1',
			storageId: 'storage_1' as never
		});

		expect(reference).toMatch(/^storage:v1:storage_1:org_1:[0-9a-f]+$/);
	});

	it('requires a signing secret when creating profile image references', async () => {
		await expect(
			createProfileImageReference({
				userId: 'user_1',
				organizationId: 'org_1',
				storageId: 'storage_1' as never
			})
		).rejects.toThrow('Profile image signing secret is not configured');
	});

	it('creates and validates avatar upload tokens', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-30T00:00:00.000Z'));
		process.env.BETTER_AUTH_SECRET = 'upload-secret';

		const token = await createAvatarUploadToken({
			userId: 'user_1',
			organizationId: 'org_1',
			issuedAt: Date.now()
		});

		await expect(
			resolveAvatarUploadToken({
				token,
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toEqual({ issuedAt: Date.now() });
	});

	it('rejects avatar upload tokens issued in the future', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-30T00:00:00.000Z'));
		process.env.BETTER_AUTH_SECRET = 'upload-secret';

		const token = await createAvatarUploadToken({
			userId: 'user_1',
			organizationId: 'org_1',
			issuedAt: Date.now() + 1_000
		});

		await expect(
			resolveAvatarUploadToken({
				token,
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toBeNull();
	});

	it('requires a signing secret when creating avatar upload tokens', async () => {
		await expect(
			createAvatarUploadToken({
				userId: 'user_1',
				organizationId: 'org_1',
				issuedAt: 1
			})
		).rejects.toThrow('Profile image signing secret is not configured');
	});

	it('rejects expired or tampered avatar upload tokens', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-30T00:00:00.000Z'));
		process.env.BETTER_AUTH_SECRET = 'upload-secret';

		const token = await createAvatarUploadToken({
			userId: 'user_1',
			organizationId: 'org_1',
			issuedAt: Date.now()
		});

		vi.advanceTimersByTime(61_000);

		await expect(
			resolveAvatarUploadToken({
				token,
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toBeNull();

		vi.setSystemTime(new Date('2026-03-30T00:00:00.000Z'));

		await expect(
			resolveAvatarUploadToken({
				token: `${token}tampered`,
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toBeNull();
	});

	it('rejects malformed avatar upload tokens', async () => {
		process.env.BETTER_AUTH_SECRET = 'upload-secret';

		await expect(
			resolveAvatarUploadToken({
				token: 'v1:not-a-number:signature',
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toBeNull();
	});

	it('returns null when validating upload tokens without a signing secret', async () => {
		await expect(
			resolveAvatarUploadToken({
				token: 'v1:1:signature',
				userId: 'user_1',
				organizationId: 'org_1',
				maxAgeMs: 60_000
			})
		).resolves.toBeNull();
	});

	it('returns null when there is no authenticated user', async () => {
		const t = createConvexTest();
		mocks.safeGetAuthUser.mockResolvedValueOnce(null);

		await expect(t.query(api.auth.getCurrentUser, {})).resolves.toBeNull();
	});

	it('returns the user unchanged when the profile image is not storage-backed', async () => {
		const t = createConvexTest();
		mocks.safeGetAuthUser.mockResolvedValueOnce({
			...baseUser,
			image: 'https://example.com/avatar.png'
		});

		await expect(t.query(api.auth.getCurrentUser, {})).resolves.toMatchObject({
			image: 'https://example.com/avatar.png'
		});
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('resolves authorized storage-backed profile images', async () => {
		process.env.PROFILE_IMAGE_SIGNING_SECRET = 'profile-secret';
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);
		const image = await createProfileImageReference({
			userId: 'user_1',
			organizationId: 'org_1',
			storageId
		});

		mocks.safeGetAuthUser.mockResolvedValueOnce({
			...baseUser,
			image
		});

		const result = await t.query(api.auth.getCurrentUser, {});

		expect(result).toMatchObject({
			_id: 'user_1'
		});
		expect(result?.image).toEqual(expect.stringContaining('http'));
		expect(mocks.requireOrgMembership).toHaveBeenCalledWith(expect.anything(), 'user_1', 'org_1');
	});

	it('clears storage-backed images with invalid signatures', async () => {
		process.env.PROFILE_IMAGE_SIGNING_SECRET = 'profile-secret';
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);
		const image = await createProfileImageReference({
			userId: 'another-user',
			organizationId: 'org_1',
			storageId
		});

		mocks.safeGetAuthUser.mockResolvedValueOnce({
			...baseUser,
			image
		});

		await expect(t.query(api.auth.getCurrentUser, {})).resolves.toMatchObject({
			image: null
		});
		expect(mocks.requireOrgMembership).not.toHaveBeenCalled();
	});

	it('clears storage-backed images when membership checks fail', async () => {
		process.env.PROFILE_IMAGE_SIGNING_SECRET = 'profile-secret';
		const t = createConvexTest();
		const storageId = await t.run((ctx) =>
			ctx.storage.store(new Blob(['avatar'], { type: 'image/png' }))
		);
		const image = await createProfileImageReference({
			userId: 'user_1',
			organizationId: 'org_1',
			storageId
		});

		mocks.safeGetAuthUser.mockResolvedValueOnce({
			...baseUser,
			image
		});
		mocks.requireOrgMembership.mockRejectedValueOnce(new Error('not a member'));

		await expect(t.query(api.auth.getCurrentUser, {})).resolves.toMatchObject({
			image: null
		});
	});
});

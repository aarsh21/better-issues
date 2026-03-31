import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	createConvexHttpClient: vi.fn(),
	getRequestEvent: vi.fn(),
	publicEnv: {
		convexUrl: 'https://public-convex.example'
	},
	queryCurrentUser: vi.fn(),
	privateEnv: {
		CONVEX_URL: undefined as string | undefined
	}
}));

vi.mock('$app/server', () => ({
	getRequestEvent: mocks.getRequestEvent
}));

vi.mock('$env/dynamic/private', () => ({
	env: mocks.privateEnv
}));

vi.mock('@mmailaender/convex-better-auth-svelte/sveltekit', () => ({
	createConvexHttpClient: mocks.createConvexHttpClient
}));

vi.mock('$lib/public-env', () => ({
	publicEnv: mocks.publicEnv
}));

vi.mock('$convex/_generated/api', () => ({
	api: {
		auth: {
			getCurrentUser: 'auth:getCurrentUser'
		}
	}
}));

import { getOptionalUser, redirectAuthenticatedUser, requireUser } from './auth';

describe('server auth helpers', () => {
	beforeEach(() => {
		mocks.privateEnv.CONVEX_URL = undefined;
		mocks.publicEnv.convexUrl = 'https://public-convex.example';
		mocks.queryCurrentUser.mockReset();
		mocks.getRequestEvent.mockReset();
		mocks.createConvexHttpClient.mockReset();
		mocks.createConvexHttpClient.mockReturnValue({
			query: mocks.queryCurrentUser
		});
		mocks.getRequestEvent.mockReturnValue({
			url: new URL('http://localhost/org/acme?tab=settings')
		});
	});

	it('queries the current user with the private Convex URL when available', async () => {
		mocks.privateEnv.CONVEX_URL = 'https://private-convex.example';
		mocks.queryCurrentUser.mockResolvedValue({ _id: 'user_1' });

		await expect(getOptionalUser()).resolves.toEqual({ _id: 'user_1' });

		expect(mocks.createConvexHttpClient).toHaveBeenCalledWith({
			convexUrl: 'https://private-convex.example'
		});
		expect(mocks.queryCurrentUser).toHaveBeenCalledWith('auth:getCurrentUser', {});
	});

	it('falls back to the public Convex URL when the private one is missing', async () => {
		mocks.queryCurrentUser.mockResolvedValue(null);

		await expect(getOptionalUser()).resolves.toBeNull();

		expect(mocks.createConvexHttpClient).toHaveBeenCalledWith({
			convexUrl: 'https://public-convex.example'
		});
	});

	it('returns the authenticated user from requireUser', async () => {
		const currentUser = { _id: 'user_2', email: 'owner@example.com' };
		mocks.queryCurrentUser.mockResolvedValue(currentUser);

		await expect(requireUser()).resolves.toEqual(currentUser);
	});

	it('redirects unauthenticated users to sign-in with a safe returnTo value', async () => {
		mocks.queryCurrentUser.mockResolvedValue(null);
		mocks.getRequestEvent.mockReturnValue({
			url: new URL('http://localhost/org/acme/issues/new?template=blank')
		});

		await expect(requireUser()).rejects.toMatchObject({
			status: 303,
			location: '/sign-in?returnTo=%2Forg%2Facme%2Fissues%2Fnew%3Ftemplate%3Dblank'
		});
	});

	it('returns null from redirectAuthenticatedUser when there is no session', async () => {
		mocks.queryCurrentUser.mockResolvedValue(null);

		await expect(redirectAuthenticatedUser()).resolves.toBeNull();
	});

	it('redirects authenticated users to a sanitized returnTo path', async () => {
		mocks.queryCurrentUser.mockResolvedValue({ _id: 'user_3' });
		mocks.getRequestEvent.mockReturnValue({
			url: new URL('http://localhost/sign-in?returnTo=/org/acme')
		});

		await expect(redirectAuthenticatedUser()).rejects.toMatchObject({
			status: 303,
			location: '/org/acme'
		});
	});

	it('redirects authenticated users to the fallback when returnTo is unsafe', async () => {
		mocks.queryCurrentUser.mockResolvedValue({ _id: 'user_4' });
		mocks.getRequestEvent.mockReturnValue({
			url: new URL('http://localhost/sign-in?returnTo=https://evil.example')
		});

		await expect(redirectAuthenticatedUser('/org/custom')).rejects.toMatchObject({
			status: 303,
			location: '/org/custom'
		});
	});
});

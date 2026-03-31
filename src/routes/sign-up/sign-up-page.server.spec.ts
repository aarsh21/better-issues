import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	publicEnv: {
		allowSignups: true
	},
	redirectAuthenticatedUser: vi.fn()
}));

vi.mock('$lib/public-env', () => ({
	publicEnv: mocks.publicEnv
}));

vi.mock('$lib/server/auth', () => ({
	redirectAuthenticatedUser: mocks.redirectAuthenticatedUser
}));

import { load } from './+page.server';

describe('sign-up page server load', () => {
	beforeEach(() => {
		mocks.publicEnv.allowSignups = true;
		mocks.redirectAuthenticatedUser.mockReset();
		mocks.redirectAuthenticatedUser.mockResolvedValue(null);
	});

	it('returns a sanitized returnTo value when signups are enabled', async () => {
		const event = {
			url: new URL('http://localhost/sign-up?returnTo=/org/acme')
		} as Parameters<typeof load>[0];

		await expect(load(event)).resolves.toEqual({ returnTo: '/org/acme' });
		expect(mocks.redirectAuthenticatedUser).toHaveBeenCalledTimes(1);
	});

	it('redirects to sign-in when signups are disabled', async () => {
		mocks.publicEnv.allowSignups = false;
		const event = {
			url: new URL('http://localhost/sign-up?returnTo=/org/acme')
		} as Parameters<typeof load>[0];

		await expect(load(event)).rejects.toMatchObject({
			status: 303,
			location: '/sign-in'
		});
	});
});

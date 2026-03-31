import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	redirectAuthenticatedUser: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	redirectAuthenticatedUser: mocks.redirectAuthenticatedUser
}));

import { load } from './+page.server';

describe('sign-in page server load', () => {
	beforeEach(() => {
		mocks.redirectAuthenticatedUser.mockReset();
		mocks.redirectAuthenticatedUser.mockResolvedValue(null);
	});

	it('sanitizes returnTo before exposing it to the page', async () => {
		const event = {
			url: new URL('http://localhost/sign-in?returnTo=/org/acme')
		} as Parameters<typeof load>[0];

		await expect(load(event)).resolves.toEqual({ returnTo: '/org/acme' });
		expect(mocks.redirectAuthenticatedUser).toHaveBeenCalledTimes(1);
	});

	it('drops unsafe returnTo destinations', async () => {
		const event = {
			url: new URL('http://localhost/sign-in?returnTo=https://evil.example')
		} as Parameters<typeof load>[0];

		await expect(load(event)).resolves.toEqual({ returnTo: undefined });
	});
});

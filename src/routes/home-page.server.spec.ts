import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getOptionalUser: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	getOptionalUser: mocks.getOptionalUser
}));

import { load } from './+page.server';

describe('home page server load', () => {
	beforeEach(() => {
		mocks.getOptionalUser.mockReset();
	});

	it('returns the current user from the auth helper', async () => {
		const currentUser = { _id: 'user_home' };
		mocks.getOptionalUser.mockResolvedValue(currentUser);

		await expect(load({} as Parameters<typeof load>[0])).resolves.toEqual({ currentUser });
		expect(mocks.getOptionalUser).toHaveBeenCalledTimes(1);
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireUser: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	requireUser: mocks.requireUser
}));

import { load } from './+layout.server';

describe('org layout server load', () => {
	beforeEach(() => {
		mocks.requireUser.mockReset();
	});

	it('returns the authenticated user', async () => {
		const currentUser = { _id: 'user_slug' };
		mocks.requireUser.mockResolvedValue(currentUser);

		await expect(load({} as Parameters<typeof load>[0])).resolves.toEqual({ currentUser });
		expect(mocks.requireUser).toHaveBeenCalledTimes(1);
	});
});

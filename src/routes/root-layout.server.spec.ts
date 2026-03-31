import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getAuthState: vi.fn()
}));

vi.mock('@mmailaender/convex-better-auth-svelte/sveltekit', () => ({
	getAuthState: mocks.getAuthState
}));

import { load } from './+layout.server';

describe('root layout server load', () => {
	beforeEach(() => {
		mocks.getAuthState.mockReset();
	});

	it('returns the auth state from Better Auth', () => {
		const authState = { isAuthenticated: true };
		mocks.getAuthState.mockReturnValue(authState);

		expect(load({} as Parameters<typeof load>[0])).toEqual({ authState });
	});
});

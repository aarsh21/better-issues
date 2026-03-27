import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import OrgPage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	signOut: vi.fn(),
	gotoResolvedPath: vi.fn()
}));

vi.mock('$lib/auth-client', () => ({
	authClient: {
		signOut: mocks.signOut
	}
}));

vi.mock('$lib/goto-resolved', () => ({
	gotoResolvedPath: mocks.gotoResolvedPath
}));

describe('org page', () => {
	beforeEach(() => {
		mocks.signOut.mockReset();
		mocks.gotoResolvedPath.mockReset();
		mocks.signOut.mockResolvedValue({});
		mocks.gotoResolvedPath.mockResolvedValue(undefined);
	});

	it('shows the authenticated user and signs out successfully', async () => {
		const currentUser: PageProps['data']['currentUser'] = {
			_id: 'user_123' as PageProps['data']['currentUser']['_id'],
			_creationTime: 0,
			name: 'Better Issues',
			email: 'owner@example.com',
			emailVerified: true,
			image: null,
			createdAt: 0,
			updatedAt: 0,
			username: 'owner',
			displayUsername: 'owner',
			userId: null
		};

		render(OrgPage, {
			data: {
				currentUser
			},
			form: undefined,
			params: {}
		});

		await expect.element(page.getByText('Better Issues')).toBeInTheDocument();
		await expect.element(page.getByText('owner@example.com')).toBeInTheDocument();

		await page.getByRole('button', { name: 'Sign out' }).click();

		await vi.waitFor(() => {
			expect(mocks.signOut).toHaveBeenCalled();
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/sign-in');
		});
	});
});

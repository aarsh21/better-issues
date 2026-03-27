import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

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
		render(OrgPage, {
			data: {
				currentUser: {
					name: 'Better Issues',
					email: 'owner@example.com'
				}
			}
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

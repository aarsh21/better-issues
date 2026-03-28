import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import SignUpPage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	signUpEmail: vi.fn(),
	gotoResolvedPath: vi.fn()
}));

vi.mock('$lib/auth-client', () => ({
	authClient: {
		signUp: {
			email: mocks.signUpEmail
		}
	}
}));

vi.mock('$lib/goto-resolved', () => ({
	gotoResolvedPath: mocks.gotoResolvedPath
}));

vi.mock(
	'$lib/components/mode-toggle.svelte',
	() => import('$lib/components/mode-toggle.stub.svelte')
);

describe('sign-up page', () => {
	beforeEach(() => {
		mocks.signUpEmail.mockReset();
		mocks.gotoResolvedPath.mockReset();
		mocks.signUpEmail.mockResolvedValue({});
		mocks.gotoResolvedPath.mockResolvedValue(undefined);
	});

	it('creates an account and redirects to the protected page', async () => {
		render(SignUpPage, {
			data: {
				authState: { isAuthenticated: false },
				returnTo: '/org'
			},
			form: undefined,
			params: {}
		});

		await page.getByLabelText(/^Name$/).fill('Better Issues');
		await page.getByLabelText(/^Username$/).fill('better-issues');
		await page.getByLabelText(/^Email$/).fill('owner@example.com');
		await page.getByLabelText(/^Password$/).fill('SuperSecret123!');
		await page.getByRole('button', { name: 'Create Account' }).click();

		await vi.waitFor(() => {
			expect(mocks.signUpEmail).toHaveBeenCalledWith({
				name: 'Better Issues',
				username: 'better-issues',
				email: 'owner@example.com',
				password: 'SuperSecret123!'
			});
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org');
		});

		await expect.element(page.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
	});
});

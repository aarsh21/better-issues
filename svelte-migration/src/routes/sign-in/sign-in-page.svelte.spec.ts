import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import SignInPage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	signInEmail: vi.fn(),
	signInUsername: vi.fn(),
	gotoResolvedPath: vi.fn()
}));

vi.mock('$lib/auth-client', () => ({
	authClient: {
		signIn: {
			email: mocks.signInEmail,
			username: mocks.signInUsername
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

vi.mock('$lib/public-env', () => ({
	publicEnv: {
		allowSignups: true
	}
}));

describe('sign-in page', () => {
	beforeEach(() => {
		mocks.signInEmail.mockReset();
		mocks.signInUsername.mockReset();
		mocks.gotoResolvedPath.mockReset();
		mocks.signInEmail.mockResolvedValue({});
		mocks.signInUsername.mockResolvedValue({});
		mocks.gotoResolvedPath.mockResolvedValue(undefined);
	});

	it('uses email sign-in when the identifier is an email address', async () => {
		render(SignInPage, {
			data: {
				returnTo: '/org'
			},
			form: undefined,
			params: {}
		});

		await page.getByLabelText('Email or Username').fill('user@example.com');
		await page.getByLabelText('Password').fill('SuperSecret123!');
		await page.getByRole('button', { name: 'Sign In' }).click();

		await vi.waitFor(() => {
			expect(mocks.signInEmail).toHaveBeenCalledWith({
				email: 'user@example.com',
				password: 'SuperSecret123!'
			});
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org');
		});

		await expect.element(page.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
	});

	it('uses username sign-in when the identifier is not an email address', async () => {
		render(SignInPage, {
			data: {
				returnTo: '/org'
			},
			form: undefined,
			params: {}
		});

		await page.getByLabelText('Email or Username').fill('issue-admin');
		await page.getByLabelText('Password').fill('SuperSecret123!');
		await page.getByRole('button', { name: 'Sign In' }).click();

		await vi.waitFor(() => {
			expect(mocks.signInUsername).toHaveBeenCalledWith({
				username: 'issue-admin',
				password: 'SuperSecret123!'
			});
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org');
		});
	});
});

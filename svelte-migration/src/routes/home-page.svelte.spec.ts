import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import HomePage from './+page.svelte';

describe('home page', () => {
	it('shows marketing copy and unauthenticated nav CTA', async () => {
		render(HomePage, {
			data: {
				currentUser: null
			},
			form: undefined,
			params: {}
		});

		await expect.element(page.getByText('better-issues').first()).toBeInTheDocument();
		await expect.element(page.getByText('Issue tracking')).toBeInTheDocument();
		await expect.element(page.getByText('Everything in one place.')).toBeInTheDocument();

		const signIn = page.getByRole('link', { name: 'Sign in' });
		await expect.element(signIn).toBeInTheDocument();
		await expect(signIn).toHaveAttribute('href', '/sign-in');

		const tryDemoLinks = page.getByRole('link', { name: 'Try the demo' });
		await expect(tryDemoLinks.elements()).toHaveLength(2);
		await expect(tryDemoLinks.nth(0)).toHaveAttribute('href', '/sign-in');
		await expect(tryDemoLinks.nth(1)).toHaveAttribute('href', '/sign-in');
	});

	it('shows Dashboard nav CTA when authenticated', async () => {
		const currentUser: NonNullable<PageProps['data']['currentUser']> = {
			_id: 'user_home' as NonNullable<PageProps['data']['currentUser']>['_id'],
			_creationTime: 0,
			name: 'Demo User',
			email: 'demo@example.com',
			emailVerified: true,
			image: null,
			createdAt: 0,
			updatedAt: 0,
			username: 'demo',
			displayUsername: 'demo',
			userId: null
		};

		render(HomePage, {
			data: {
				currentUser
			},
			form: undefined,
			params: {}
		});

		const dashboard = page.getByRole('link', { name: 'Dashboard' });
		await expect.element(dashboard).toBeInTheDocument();
		await expect(dashboard).toHaveAttribute('href', '/org');
	});
});

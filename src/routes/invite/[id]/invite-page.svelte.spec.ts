import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import type { InvitationSummary } from '$lib/server/organization';
import InvitePage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	acceptInvitation: vi.fn(),
	rejectInvitation: vi.fn(),
	gotoResolvedPath: vi.fn()
}));

vi.mock('@lucide/svelte/icons/check-circle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/loader-2', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/mail', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/x-circle', () => import('$lib/test/lucide-icon-stub.svelte'));

vi.mock('$lib/organization', () => ({
	slugifyOrganizationName: (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, ''),
	listOrganizations: vi.fn(),
	setActiveOrganization: vi.fn(),
	createOrganization: vi.fn(),
	getActiveOrganization: vi.fn(),
	getInvitation: vi.fn(),
	acceptInvitation: mocks.acceptInvitation,
	rejectInvitation: mocks.rejectInvitation
}));

vi.mock('$lib/goto-resolved', () => ({
	gotoResolvedPath: mocks.gotoResolvedPath
}));

vi.mock(
	'$lib/components/mode-toggle.svelte',
	() => import('$lib/components/mode-toggle.stub.svelte')
);

describe('invite page', () => {
	const currentUser: NonNullable<PageProps['data']['currentUser']> = {
		_id: 'user_123' as NonNullable<PageProps['data']['currentUser']>['_id'],
		_creationTime: 0,
		name: 'Invited User',
		email: 'invitee@example.com',
		emailVerified: true,
		image: null,
		createdAt: 0,
		updatedAt: 0,
		username: 'invitee',
		displayUsername: 'invitee',
		userId: null
	};

	beforeEach(() => {
		mocks.acceptInvitation.mockReset();
		mocks.rejectInvitation.mockReset();
		mocks.gotoResolvedPath.mockReset();
		mocks.gotoResolvedPath.mockResolvedValue(undefined);
		mocks.acceptInvitation.mockResolvedValue(undefined);
		mocks.rejectInvitation.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function renderInvite(opts: {
		invitation?: InvitationSummary | null;
		isAuthenticated?: boolean;
	}) {
		const isAuthenticated = opts.isAuthenticated ?? true;
		render(InvitePage, {
			data: {
				authState: { isAuthenticated },
				currentUser: isAuthenticated ? currentUser : null,
				invitation: opts.invitation ?? null,
				isAuthenticated
			},
			form: undefined,
			params: { id: opts.invitation?.id ?? 'inv_0' }
		});
	}

	it('shows not-found when invitation is null', async () => {
		renderInvite({ invitation: null });

		await expect.element(page.getByText('Invitation not found')).toBeInTheDocument();
	});

	it('renders pending invitation details', async () => {
		renderInvite({
			invitation: {
				id: 'inv_2',
				status: 'pending',
				role: 'admin',
				expiresAt: new Date('2030-01-15T00:00:00.000Z').getTime(),
				organizationName: 'Acme'
			}
		});

		await expect
			.element(page.getByText('You\u2019ve been invited', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('admin', { exact: true })).toBeInTheDocument();
	});

	it('accepts an invitation and schedules navigation to /org', async () => {
		vi.useFakeTimers();

		renderInvite({
			invitation: {
				id: 'inv_3',
				status: 'pending',
				role: 'member',
				expiresAt: Date.now() + 86400000,
				organizationName: 'Acme'
			}
		});

		await vi.waitFor(() => {
			expect(page.getByRole('button', { name: 'Accept Invitation' }).query()).toBeTruthy();
		});

		await page.getByRole('button', { name: 'Accept Invitation' }).click();

		await vi.waitFor(() => {
			expect(mocks.acceptInvitation).toHaveBeenCalledWith('inv_3');
		});

		await expect.element(page.getByText('Invitation accepted')).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(1_500);

		await vi.waitFor(() => {
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org');
		});
	});

	it('rejects an invitation and shows the declined state', async () => {
		renderInvite({
			invitation: {
				id: 'inv_4',
				status: 'pending',
				role: 'member',
				expiresAt: Date.now() + 86400000,
				organizationName: 'Acme'
			}
		});

		await vi.waitFor(() => {
			expect(page.getByRole('button', { name: 'Decline' }).query()).toBeTruthy();
		});

		await page.getByRole('button', { name: 'Decline' }).click();

		await vi.waitFor(() => {
			expect(mocks.rejectInvitation).toHaveBeenCalledWith('inv_4');
		});

		await expect.element(page.getByText('Invitation declined')).toBeInTheDocument();
	});

	it('shows sign-in prompt for signed-out users with a pending invitation', async () => {
		renderInvite({
			isAuthenticated: false,
			invitation: {
				id: 'inv_5',
				status: 'pending',
				role: 'member',
				expiresAt: Date.now() + 86400000,
				organizationName: 'Acme'
			}
		});

		await expect
			.element(page.getByText('You\u2019ve been invited', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Sign in to accept' }))
			.toBeInTheDocument();
	});

	it('shows expired invitations as non-actionable', async () => {
		renderInvite({
			isAuthenticated: false,
			invitation: {
				id: 'inv_6',
				status: 'expired',
				role: 'member',
				expiresAt: Date.now() - 60_000,
				organizationName: 'Acme'
			}
		});

		await expect.element(page.getByText('Invitation expired')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Sign in to accept' }).query()).toBeNull();
		expect(page.getByRole('button', { name: 'Accept Invitation' }).query()).toBeNull();
	});
});

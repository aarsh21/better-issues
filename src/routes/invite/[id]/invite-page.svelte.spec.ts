import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import InvitePage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	getInvitation: vi.fn(),
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
	getInvitation: mocks.getInvitation,
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
	const currentUser: PageProps['data']['currentUser'] = {
		_id: 'user_123' as PageProps['data']['currentUser']['_id'],
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
		mocks.getInvitation.mockReset();
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

	function renderInvite(id: string) {
		render(InvitePage, {
			data: { authState: { isAuthenticated: true }, currentUser },
			form: undefined,
			params: { id }
		});
	}

	it('shows loading until the invitation is fetched', async () => {
		let resolveGet: (v: {
			id: string;
			organizationId: string;
			email: string;
			role: string;
			status: 'pending';
			expiresAt: null;
		}) => void;
		mocks.getInvitation.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveGet = resolve;
				})
		);

		renderInvite('inv_1');

		await expect.element(page.getByText('Loading invitation...')).toBeInTheDocument();

		resolveGet!({
			id: 'inv_1',
			organizationId: 'org1',
			email: 'a@b.com',
			role: 'member',
			status: 'pending',
			expiresAt: null
		});

		await vi.waitFor(() => {
			expect(page.getByText('You’ve been invited', { exact: true }).query()).toBeTruthy();
		});
	});

	it('renders pending invitation details', async () => {
		mocks.getInvitation.mockResolvedValue({
			id: 'inv_2',
			organizationId: 'org1',
			email: 'a@b.com',
			role: 'admin',
			status: 'pending',
			expiresAt: new Date('2030-01-15T00:00:00.000Z')
		});

		renderInvite('inv_2');

		await vi.waitFor(() => {
			expect(mocks.getInvitation).toHaveBeenCalledWith('inv_2');
		});

		await expect
			.element(page.getByText('You’ve been invited', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('admin', { exact: true })).toBeInTheDocument();
	});

	it('accepts an invitation and schedules navigation to /org', async () => {
		vi.useFakeTimers();

		mocks.getInvitation.mockResolvedValue({
			id: 'inv_3',
			organizationId: 'org1',
			email: 'a@b.com',
			role: 'member',
			status: 'pending',
			expiresAt: null
		});

		renderInvite('inv_3');

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
		mocks.getInvitation.mockResolvedValue({
			id: 'inv_4',
			organizationId: 'org1',
			email: 'a@b.com',
			role: 'member',
			status: 'pending',
			expiresAt: null
		});

		renderInvite('inv_4');

		await vi.waitFor(() => {
			expect(page.getByRole('button', { name: 'Decline' }).query()).toBeTruthy();
		});

		await page.getByRole('button', { name: 'Decline' }).click();

		await vi.waitFor(() => {
			expect(mocks.rejectInvitation).toHaveBeenCalledWith('inv_4');
		});

		await expect.element(page.getByText('Invitation declined')).toBeInTheDocument();
	});
});

import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import OrgPage from './+page.svelte';

const mocks = vi.hoisted(() => ({
	listOrganizations: vi.fn(),
	setActiveOrganization: vi.fn(),
	createOrganization: vi.fn(),
	gotoResolvedPath: vi.fn()
}));

vi.mock('@lucide/svelte/icons/plus', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/arrow-right', () => import('$lib/test/lucide-icon-stub.svelte'));

vi.mock('$lib/organization', () => ({
	slugifyOrganizationName: (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, ''),
	listOrganizations: mocks.listOrganizations,
	setActiveOrganization: mocks.setActiveOrganization,
	createOrganization: mocks.createOrganization,
	getActiveOrganization: vi.fn(),
	getInvitation: vi.fn(),
	acceptInvitation: vi.fn(),
	rejectInvitation: vi.fn()
}));

vi.mock('$lib/goto-resolved', () => ({
	gotoResolvedPath: mocks.gotoResolvedPath
}));

vi.mock(
	'$lib/components/mode-toggle.svelte',
	() => import('$lib/components/mode-toggle.stub.svelte')
);

describe('org page', () => {
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

	beforeEach(() => {
		mocks.listOrganizations.mockReset();
		mocks.setActiveOrganization.mockReset();
		mocks.createOrganization.mockReset();
		mocks.gotoResolvedPath.mockReset();
		mocks.gotoResolvedPath.mockResolvedValue(undefined);
		mocks.setActiveOrganization.mockResolvedValue(undefined);
		mocks.createOrganization.mockResolvedValue({
			id: 'org_new',
			name: 'New',
			slug: 'new'
		});
	});

	function renderOrgPage() {
		render(OrgPage, {
			data: { authState: { isAuthenticated: true }, currentUser },
			form: undefined,
			params: {}
		});
	}

	it('shows loading skeletons until organizations resolve', async () => {
		let resolveList: (v: { id: string; name: string; slug: string }[]) => void;
		mocks.listOrganizations.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveList = resolve;
				})
		);

		renderOrgPage();

		await expect.element(page.getByText('Your Teams')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'New Team' })).toBeInTheDocument();

		resolveList!([
			{ id: '1', name: 'A', slug: 'a' },
			{ id: '2', name: 'B', slug: 'b' }
		]);

		await expect.element(page.getByText('A', { exact: true })).toBeInTheDocument();
	});

	it('lists teams and navigates with active org when a row is clicked', async () => {
		mocks.listOrganizations.mockResolvedValue([
			{ id: 'o1', name: 'Acme', slug: 'acme' },
			{ id: 'o2', name: 'Beta', slug: 'beta' }
		]);

		renderOrgPage();

		await vi.waitFor(() => {
			expect(mocks.listOrganizations).toHaveBeenCalled();
		});

		await expect.element(page.getByText('Acme', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('/acme')).toBeInTheDocument();

		await page.getByRole('button', { name: /Acme/ }).click();

		await vi.waitFor(() => {
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org/acme');
			expect(mocks.setActiveOrganization).toHaveBeenCalledWith({ organizationSlug: 'acme' });
		});
	});

	it('auto-selects the only team and navigates once', async () => {
		mocks.listOrganizations.mockResolvedValue([{ id: 'only', name: 'Solo', slug: 'solo' }]);

		renderOrgPage();

		await vi.waitFor(() => {
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org/solo');
			expect(mocks.setActiveOrganization).toHaveBeenCalledWith({ organizationSlug: 'solo' });
		});
	});

	it('shows the empty state when there are no teams', async () => {
		mocks.listOrganizations.mockResolvedValue([]);

		renderOrgPage();

		await expect.element(page.getByText('No teams yet')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Create Team' })).toBeInTheDocument();
	});

	it('shows an error alert when team loading fails', async () => {
		mocks.listOrganizations.mockRejectedValue(new Error('Failed to load teams'));

		renderOrgPage();

		await expect.element(page.getByText('Failed to load teams')).toBeInTheDocument();
		await expect.element(page.getByText('No teams yet')).not.toBeInTheDocument();
	});
});

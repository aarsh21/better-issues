import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import type { PageProps } from './$types';
import OrgPage from './+page.svelte';

const mocks = vi.hoisted(() => ({
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
	listOrganizations: vi.fn(),
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

	function renderOrgPage(organizations: PageProps['data']['organizations'] = []) {
		render(OrgPage, {
			data: {
				authState: { isAuthenticated: true },
				currentUser,
				organizations
			},
			form: undefined,
			params: {}
		});
	}

	it('lists teams and navigates with active org when a row is clicked', async () => {
		renderOrgPage([
			{ id: 'o1', name: 'Acme', slug: 'acme' },
			{ id: 'o2', name: 'Beta', slug: 'beta' }
		]);

		await expect.element(page.getByText('Acme', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('/acme')).toBeInTheDocument();

		await page.getByRole('button', { name: /Acme/ }).click();

		await vi.waitFor(() => {
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org/acme');
			expect(mocks.setActiveOrganization).toHaveBeenCalledWith({ organizationSlug: 'acme' });
		});
	});

	it('auto-selects the only team and navigates once', async () => {
		renderOrgPage([{ id: 'only', name: 'Solo', slug: 'solo' }]);

		await vi.waitFor(() => {
			expect(mocks.gotoResolvedPath).toHaveBeenCalledWith('/org/solo');
			expect(mocks.setActiveOrganization).toHaveBeenCalledWith({ organizationSlug: 'solo' });
		});
	});

	it('shows the empty state when there are no teams', async () => {
		renderOrgPage([]);

		await expect.element(page.getByText('No teams yet')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Create Team' })).toBeInTheDocument();
	});
});

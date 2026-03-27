import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import IssueListBody from './issue-list-body.svelte';

const paginated = vi.hoisted(() => ({
	results: [] as Array<Record<string, unknown>>,
	status: 'LoadingFirstPage' as
		| 'LoadingFirstPage'
		| 'CanLoadMore'
		| 'LoadingMore'
		| 'Exhausted',
	loadMore: vi.fn(() => true),
	isLoading: true,
	error: undefined as Error | undefined
}));

const labelsQuery = vi.hoisted(() => ({
	data: [] as Array<Record<string, unknown>>,
	isLoading: true,
	error: undefined as Error | undefined
}));

vi.mock('$app/paths', () => ({
	resolve: (p: string) => p
}));

vi.mock('@mmailaender/convex-svelte', () => ({
	usePaginatedQuery: vi.fn(() => paginated),
	useQuery: vi.fn(() => labelsQuery),
	useMutation: vi.fn(() => vi.fn())
}));

vi.mock('@lucide/svelte/icons/plus', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('issue list body', () => {
	beforeEach(() => {
		paginated.results = [];
		paginated.status = 'LoadingFirstPage';
		paginated.isLoading = true;
		paginated.error = undefined;
		paginated.loadMore.mockClear();
		labelsQuery.data = [];
		labelsQuery.isLoading = false;
		labelsQuery.error = undefined;
	});

	it('shows loading skeletons while the first page loads', async () => {
		render(IssueListBody, {
			slug: 'acme',
			organizationId: 'org_1',
			statusFilter: undefined,
			onStatusChange: vi.fn()
		});

		await expect.element(page.getByRole('heading', { name: 'Issues' })).toBeInTheDocument();

		const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('renders issue rows when data resolves', async () => {
		paginated.status = 'Exhausted';
		paginated.isLoading = false;
		paginated.results = [
			{
				_id: 'issue_1',
				_creationTime: 1,
				organizationId: 'org_1',
				number: 12,
				title: 'Fix sidebar',
				status: 'open',
				priority: 'medium',
				labelIds: [],
				createdBy: 'u1',
				createdAt: 1,
				updatedAt: 1
			}
		];

		render(IssueListBody, {
			slug: 'acme',
			organizationId: 'org_1',
			statusFilter: undefined,
			onStatusChange: vi.fn()
		});

		await vi.waitFor(() => {
			expect(page.getByText('Fix sidebar').query()).toBeTruthy();
		});

		await expect.element(page.getByText('#12')).toBeInTheDocument();
	});
});

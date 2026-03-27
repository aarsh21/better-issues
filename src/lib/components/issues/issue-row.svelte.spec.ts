import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import IssueRow from './issue-row.svelte';

vi.mock('$app/paths', () => ({
	resolve: (p: string) => p
}));

// Icons used by issue-row directly
vi.mock('@lucide/svelte/icons/chevron-right', () => import('$lib/test/lucide-icon-stub.svelte'));

// Icons used by status-badge
vi.mock('@lucide/svelte/icons/circle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-dot', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-check', () => import('$lib/test/lucide-icon-stub.svelte'));

// Icons used by priority-indicator
vi.mock('@lucide/svelte/icons/alert-triangle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-high', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-medium', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-low', () => import('$lib/test/lucide-icon-stub.svelte'));

const mockIssue = {
	_id: 'issue_1' as any,
	_creationTime: 1,
	organizationId: 'org_1' as any,
	number: 42,
	title: 'Fix the sidebar bug',
	status: 'open' as const,
	priority: 'high' as const,
	labelIds: ['label_1'] as any[],
	createdBy: 'u1',
	createdAt: 1,
	updatedAt: 1
};

const mockLabels = [
	{
		_id: 'label_1' as any,
		_creationTime: 1,
		organizationId: 'org_1' as any,
		name: 'Bug',
		color: '#ef4444'
	}
];

describe('issue row', () => {
	it('renders the issue number', async () => {
		render(IssueRow, {
			slug: 'acme',
			issue: mockIssue,
			labels: mockLabels
		});

		await expect.element(page.getByText('#42')).toBeInTheDocument();
	});

	it('renders the issue title', async () => {
		render(IssueRow, {
			slug: 'acme',
			issue: mockIssue,
			labels: mockLabels
		});

		await expect.element(page.getByText('Fix the sidebar bug')).toBeInTheDocument();
	});

	it('applies opacity class when issue is closed', async () => {
		const closedIssue = { ...mockIssue, status: 'closed' as const };

		render(IssueRow, {
			slug: 'acme',
			issue: closedIssue,
			labels: mockLabels
		});

		await expect.element(page.getByText('#42')).toBeInTheDocument();

		const link = page.getByRole('link').element();
		expect(link.className).toContain('opacity-60');
	});
});

import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import PriorityIndicator from './priority-indicator.svelte';

vi.mock('@lucide/svelte/icons/alert-triangle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-high', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-medium', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-low', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('priority indicator', () => {
	it('renders a priority icon for urgent issues', async () => {
		render(PriorityIndicator, { priority: 'urgent' });

		expect(document.querySelector('.icon-stub')).toBeTruthy();
	});

	it('renders a priority icon for high issues', async () => {
		render(PriorityIndicator, { priority: 'high' });

		expect(document.querySelector('.icon-stub')).toBeTruthy();
	});

	it('renders a priority icon for medium issues', async () => {
		render(PriorityIndicator, { priority: 'medium' });

		expect(document.querySelector('.icon-stub')).toBeTruthy();
	});

	it('renders a priority icon for low issues', async () => {
		render(PriorityIndicator, { priority: 'low' });

		expect(document.querySelector('.icon-stub')).toBeTruthy();
	});

	it('shows label text when showLabel is true for urgent', async () => {
		render(PriorityIndicator, { priority: 'urgent', showLabel: true });

		await expect.element(page.getByText('Urgent')).toBeInTheDocument();
	});

	it('shows label text when showLabel is true for low', async () => {
		render(PriorityIndicator, { priority: 'low', showLabel: true });

		await expect.element(page.getByText('Low')).toBeInTheDocument();
	});

	it('does not show label text when showLabel is false', async () => {
		render(PriorityIndicator, { priority: 'urgent' });

		await expect.element(page.getByText('Urgent')).not.toBeInTheDocument();
	});
});

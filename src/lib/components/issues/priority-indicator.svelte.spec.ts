import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import PriorityIndicator from './priority-indicator.svelte';

vi.mock('@lucide/svelte/icons/alert-triangle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-high', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-medium', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/signal-low', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('priority indicator', () => {
	it('renders without error for urgent priority', async () => {
		render(PriorityIndicator, { priority: 'urgent' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});

	it('renders without error for high priority', async () => {
		render(PriorityIndicator, { priority: 'high' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});

	it('renders without error for medium priority', async () => {
		render(PriorityIndicator, { priority: 'medium' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});

	it('renders without error for low priority', async () => {
		render(PriorityIndicator, { priority: 'low' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
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

		expect(page.getByText('Urgent').query()).toBeNull();
	});
});

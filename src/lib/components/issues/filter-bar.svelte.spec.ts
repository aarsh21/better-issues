import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import FilterBar from './filter-bar.svelte';

vi.mock('$app/paths', () => ({
	resolve: (p: string) => p
}));

vi.mock('@lucide/svelte/icons/x', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('filter bar', () => {
	it('renders three status filter buttons', async () => {
		render(FilterBar, {
			activeStatus: undefined,
			onStatusChange: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Open' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'In Progress' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Closed' })).toBeInTheDocument();
	});

	it('calls onStatusChange with open when Open button clicked', async () => {
		const handler = vi.fn();
		render(FilterBar, {
			activeStatus: undefined,
			onStatusChange: handler
		});

		await page.getByRole('button', { name: 'Open' }).click();

		expect(handler).toHaveBeenCalledWith('open');
	});

	it('shows Clear button when activeStatus is set', async () => {
		render(FilterBar, {
			activeStatus: 'open',
			onStatusChange: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
	});

	it('does not show Clear button when activeStatus is undefined', async () => {
		render(FilterBar, {
			activeStatus: undefined,
			onStatusChange: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});

	it('calls onStatusChange with undefined when Clear is clicked', async () => {
		const handler = vi.fn();
		render(FilterBar, {
			activeStatus: 'open',
			onStatusChange: handler
		});

		await page.getByRole('button', { name: 'Clear' }).click();

		expect(handler).toHaveBeenCalledWith(undefined);
	});
});

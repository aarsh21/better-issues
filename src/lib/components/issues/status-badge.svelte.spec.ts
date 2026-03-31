import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import StatusBadge from './status-badge.svelte';

vi.mock('@lucide/svelte/icons/circle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-dot', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-check', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('status badge', () => {
	it('announces the open status', async () => {
		render(StatusBadge, { status: 'open' });

		await expect.element(page.getByLabelText('Open')).toBeInTheDocument();
	});

	it('announces the in-progress status', async () => {
		render(StatusBadge, { status: 'in_progress' });

		await expect.element(page.getByLabelText('In Progress')).toBeInTheDocument();
	});

	it('announces the closed status', async () => {
		render(StatusBadge, { status: 'closed' });

		await expect.element(page.getByLabelText('Closed')).toBeInTheDocument();
	});
});

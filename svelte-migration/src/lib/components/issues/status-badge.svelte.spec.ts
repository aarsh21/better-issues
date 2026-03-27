import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import StatusBadge from './status-badge.svelte';

vi.mock('@lucide/svelte/icons/circle', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-dot', () => import('$lib/test/lucide-icon-stub.svelte'));
vi.mock('@lucide/svelte/icons/circle-check', () => import('$lib/test/lucide-icon-stub.svelte'));

describe('status badge', () => {
	it('renders for open status', async () => {
		render(StatusBadge, { status: 'open' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});

	it('renders for in_progress status', async () => {
		render(StatusBadge, { status: 'in_progress' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});

	it('renders for closed status', async () => {
		render(StatusBadge, { status: 'closed' });

		const icons = document.querySelectorAll('.icon-stub');
		expect(icons.length).toBe(1);
	});
});

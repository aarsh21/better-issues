import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import LabelBadge from './label-badge.svelte';

describe('label badge', () => {
	it('renders the label name text', async () => {
		render(LabelBadge, { name: 'Bug', color: '#ef4444' });

		await expect.element(page.getByText('Bug')).toBeInTheDocument();
	});

	it('applies the color as inline styles', async () => {
		render(LabelBadge, { name: 'Feature', color: '#3b82f6' });

		await expect.element(page.getByText('Feature')).toBeInTheDocument();

		const badge = page.getByText('Feature').element();
		const style = badge.getAttribute('style') ?? '';
		expect(style).toContain('color');
		expect(style).toContain('border-color');
		expect(style).toContain('background-color');
	});
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

describe('health endpoint', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the current timestamp in the health payload', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-30T00:00:00.000Z'));

		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			status: 'healthy',
			timestamp: Date.parse('2026-03-30T00:00:00.000Z')
		});
	});
});

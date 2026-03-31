import { describe, expect, it } from 'vitest';

import { GET } from './+server';

describe('auth readiness endpoint', () => {
	it('returns a stable readiness payload', async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			message: 'auth route reachable',
			ok: true
		});
	});
});

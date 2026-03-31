import { expect, test } from '@playwright/test';

test.describe('API smoke', () => {
	test('health endpoint responds with the expected contract', async ({ request }) => {
		const response = await request.get('/api/health');

		expect(response.ok()).toBe(true);

		const payload = (await response.json()) as {
			readonly status: string;
			readonly timestamp: number;
		};

		expect(payload.status).toBe('healthy');
		expect(typeof payload.timestamp).toBe('number');
		expect(Number.isFinite(payload.timestamp)).toBe(true);
	});

	test('auth readiness endpoint is reachable', async ({ request }) => {
		const response = await request.get('/api/auth/ready');

		expect(response.ok()).toBe(true);

		const payload = (await response.json()) as {
			readonly ok: boolean;
			readonly message: string;
		};

		expect(payload).toEqual({
			ok: true,
			message: 'auth route reachable'
		});
	});
});

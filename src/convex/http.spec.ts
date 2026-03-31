import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const router = { route: vi.fn() };

	return {
		router,
		httpRouter: vi.fn(() => router),
		registerRoutes: vi.fn(),
		createAuth: vi.fn()
	};
});

vi.mock('convex/server', async () => {
	const actual = await vi.importActual<typeof import('convex/server')>('convex/server');

	return {
		...actual,
		httpRouter: mocks.httpRouter as unknown as typeof actual.httpRouter
	};
});

vi.mock('./auth', () => {
	return {
		authComponent: {
			registerRoutes: mocks.registerRoutes
		} as unknown as typeof import('./auth').authComponent,
		createAuth: mocks.createAuth as unknown as typeof import('./auth').createAuth
	};
});

describe('http router', () => {
	it('registers auth routes on the shared router', async () => {
		const module = await import('./http');

		expect(module.default).toBe(mocks.router);
		expect(mocks.httpRouter).toHaveBeenCalledTimes(1);
		expect(mocks.registerRoutes).toHaveBeenCalledWith(mocks.router, mocks.createAuth);
	});
});

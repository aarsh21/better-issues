import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	buildAuthProxyUrl: vi.fn(),
	createAuthProxyHeaders: vi.fn(),
	fetch: vi.fn(),
	forwardedHeaders: new Headers({
		'x-forwarded-for': '203.0.113.10'
	}),
	publicEnv: {
		convexSiteUrl: 'https://convex-site.example'
	},
	targetUrl: new URL('https://convex-site.example/api/auth/session?foo=bar')
}));

vi.mock('$lib/public-env', () => ({
	publicEnv: mocks.publicEnv
}));

vi.mock('$lib/server/auth-proxy', () => ({
	buildAuthProxyUrl: mocks.buildAuthProxyUrl,
	createAuthProxyHeaders: mocks.createAuthProxyHeaders
}));

import { GET, POST } from './+server';

describe('auth proxy endpoint', () => {
	beforeEach(() => {
		mocks.buildAuthProxyUrl.mockReset();
		mocks.createAuthProxyHeaders.mockReset();
		mocks.fetch.mockReset();
		mocks.buildAuthProxyUrl.mockReturnValue(mocks.targetUrl);
		mocks.createAuthProxyHeaders.mockReturnValue(mocks.forwardedHeaders);
		vi.stubGlobal('fetch', mocks.fetch);
	});

	it('forwards GET requests without a body', async () => {
		mocks.fetch.mockResolvedValue(
			new Response('proxied-get', {
				status: 200,
				statusText: 'OK',
				headers: new Headers({
					'x-proxy': 'get'
				})
			})
		);

		const event = {
			getClientAddress: () => '127.0.0.1',
			request: new Request('http://localhost/api/auth/session?foo=bar', {
				headers: new Headers({
					cookie: 'session=abc'
				}),
				method: 'GET'
			}),
			url: new URL('http://localhost/api/auth/session?foo=bar')
		} as Parameters<typeof GET>[0];

		const response = await GET(event);

		expect(mocks.buildAuthProxyUrl).toHaveBeenCalledWith(
			'https://convex-site.example',
			'/api/auth/session',
			'?foo=bar'
		);
		expect(mocks.createAuthProxyHeaders).toHaveBeenCalledWith(
			event.request.headers,
			'127.0.0.1',
			event.url
		);
		expect(mocks.fetch).toHaveBeenCalledWith(mocks.targetUrl, {
			body: undefined,
			headers: mocks.forwardedHeaders,
			method: 'GET',
			redirect: 'manual'
		});
		await expect(response.text()).resolves.toBe('proxied-get');
		expect(response.headers.get('x-proxy')).toBe('get');
	});

	it('forwards POST bodies and response metadata', async () => {
		mocks.fetch.mockResolvedValue(
			new Response('proxied-post', {
				status: 202,
				statusText: 'Accepted',
				headers: new Headers({
					'x-proxy': 'post'
				})
			})
		);

		const event = {
			getClientAddress: () => '127.0.0.1',
			request: new Request('http://localhost/api/auth/session', {
				body: JSON.stringify({ email: 'owner@example.com' }),
				headers: new Headers({
					'content-type': 'application/json'
				}),
				method: 'POST'
			}),
			url: new URL('http://localhost/api/auth/session')
		} as Parameters<typeof POST>[0];

		const response = await POST(event);
		const fetchInit = mocks.fetch.mock.calls[0]?.[1];

		expect(fetchInit?.method).toBe('POST');
		expect(fetchInit?.body).toBeInstanceOf(ArrayBuffer);
		expect(response.status).toBe(202);
		expect(response.statusText).toBe('Accepted');
		expect(response.headers.get('x-proxy')).toBe('post');
		await expect(response.text()).resolves.toBe('proxied-post');
	});
});

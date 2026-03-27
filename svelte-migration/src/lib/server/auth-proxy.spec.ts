import { describe, expect, it } from 'vitest';

import { buildAuthProxyUrl, createAuthProxyHeaders, getForwardedForValue } from './auth-proxy';

describe('buildAuthProxyUrl', () => {
	it('joins the auth path against the Convex site URL', () => {
		expect(
			buildAuthProxyUrl('http://127.0.0.1:3211/', '/api/auth/get-session', '?foo=bar').href
		).toBe('http://127.0.0.1:3211/api/auth/get-session?foo=bar');
	});

	it('throws when the site URL is missing', () => {
		expect(() => buildAuthProxyUrl(undefined, '/api/auth/get-session', '')).toThrow(
			'PUBLIC_CONVEX_SITE_URL must be configured to proxy Better Auth requests.'
		);
	});
});

describe('getForwardedForValue', () => {
	it('appends the client address when a proxy chain already exists', () => {
		expect(getForwardedForValue('203.0.113.10', '127.0.0.1')).toBe('203.0.113.10, 127.0.0.1');
	});

	it('uses the client address when there is no existing proxy chain', () => {
		expect(getForwardedForValue(null, '127.0.0.1')).toBe('127.0.0.1');
	});
});

describe('createAuthProxyHeaders', () => {
	it('adds forwarded client IP headers for Better Auth', () => {
		const headers = createAuthProxyHeaders(
			new Headers({
				cookie: 'session=abc'
			}),
			'127.0.0.1',
			new URL('http://localhost:5173/sign-in')
		);

		expect(headers.get('cookie')).toBe('session=abc');
		expect(headers.get('x-forwarded-for')).toBe('127.0.0.1');
		expect(headers.get('x-real-ip')).toBe('127.0.0.1');
		expect(headers.get('x-forwarded-host')).toBe('localhost:5173');
		expect(headers.get('x-forwarded-proto')).toBe('http');
	});
});

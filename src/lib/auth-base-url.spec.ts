import { describe, expect, it } from 'vitest';

import { normalizeBaseUrl } from './auth-base-url';

describe('normalizeBaseUrl', () => {
	it('returns undefined for empty values', () => {
		expect(normalizeBaseUrl(undefined)).toBeUndefined();
		expect(normalizeBaseUrl('')).toBeUndefined();
		expect(normalizeBaseUrl('   ')).toBeUndefined();
	});

	it('trims whitespace and trailing slashes', () => {
		expect(normalizeBaseUrl(' http://localhost:5173/ ')).toBe('http://localhost:5173');
		expect(normalizeBaseUrl('https://example.com///')).toBe('https://example.com');
	});
});

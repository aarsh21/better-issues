import { describe, expect, it } from 'vitest';

import { getSafeReturnTo } from './auth-routing';

describe('getSafeReturnTo', () => {
	it('returns safe app-relative paths', () => {
		expect(getSafeReturnTo('/org')).toBe('/org');
		expect(getSafeReturnTo('/org?tab=issues')).toBe('/org?tab=issues');
	});

	it('rejects empty and external destinations', () => {
		expect(getSafeReturnTo(undefined)).toBeUndefined();
		expect(getSafeReturnTo(null)).toBeUndefined();
		expect(getSafeReturnTo('')).toBeUndefined();
		expect(getSafeReturnTo('https://example.com')).toBeUndefined();
		expect(getSafeReturnTo('//example.com')).toBeUndefined();
		expect(getSafeReturnTo('org')).toBeUndefined();
	});
});

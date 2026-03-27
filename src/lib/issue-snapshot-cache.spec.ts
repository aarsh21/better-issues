import { describe, expect, it, beforeEach } from 'vitest';
import { vi } from 'vitest';

vi.mock('$convex/_generated/dataModel', () => ({}));

import {
	setIssueListSnapshot,
	getIssueListSnapshot,
	getIssueSnapshot,
	clearIssueSnapshots
} from './issue-snapshot-cache';

const mockIssue = (overrides = {}) => ({
	_id: 'id_1' as never,
	_creationTime: 1,
	number: 1,
	title: 'Test',
	organizationId: 'org_1',
	status: 'open' as const,
	priority: 'medium' as const,
	labelIds: [],
	createdBy: 'u1',
	createdAt: 1,
	updatedAt: 1,
	...overrides
});

beforeEach(() => {
	clearIssueSnapshots();
});

// ---------------------------------------------------------------------------
// setIssueListSnapshot + getIssueListSnapshot round-trip
// ---------------------------------------------------------------------------
describe('setIssueListSnapshot / getIssueListSnapshot', () => {
	it('stores and retrieves issue list by org and status', () => {
		const issues = [mockIssue(), mockIssue({ _id: 'id_2', number: 2 })];
		setIssueListSnapshot('org_1', 'open', issues);

		const result = getIssueListSnapshot('org_1', 'open');
		expect(result).toEqual(issues);
	});

	it('returns undefined for a key that was never set', () => {
		expect(getIssueListSnapshot('org_1', 'open')).toBeUndefined();
	});

	it('isolates different org/status combinations', () => {
		const openIssues = [mockIssue({ number: 1 })];
		const closedIssues = [mockIssue({ number: 2, status: 'closed' })];
		const otherOrgIssues = [mockIssue({ number: 3, organizationId: 'org_2' })];

		setIssueListSnapshot('org_1', 'open', openIssues);
		setIssueListSnapshot('org_1', 'closed', closedIssues);
		setIssueListSnapshot('org_2', 'open', otherOrgIssues);

		expect(getIssueListSnapshot('org_1', 'open')).toEqual(openIssues);
		expect(getIssueListSnapshot('org_1', 'closed')).toEqual(closedIssues);
		expect(getIssueListSnapshot('org_2', 'open')).toEqual(otherOrgIssues);

		// No cross-contamination
		expect(getIssueListSnapshot('org_2', 'closed')).toBeUndefined();
	});

	it('supports undefined status for "all statuses" key', () => {
		const issues = [mockIssue()];
		setIssueListSnapshot('org_1', undefined, issues);

		expect(getIssueListSnapshot('org_1', undefined)).toEqual(issues);
		// undefined and explicit statuses are distinct
		expect(getIssueListSnapshot('org_1', 'open')).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Snapshot copies (mutation safety)
// ---------------------------------------------------------------------------
describe('snapshot immutability', () => {
	it('stores a copy so mutating the input does not affect the cache', () => {
		const issues = [mockIssue()];
		setIssueListSnapshot('org_1', 'open', issues);

		issues.push(mockIssue({ _id: 'id_extra', number: 99 }));

		const cached = getIssueListSnapshot('org_1', 'open');
		expect(cached).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// getIssueSnapshot
// ---------------------------------------------------------------------------
describe('getIssueSnapshot', () => {
	it('finds an issue across different status caches for the same org', () => {
		setIssueListSnapshot('org_1', 'open', [mockIssue({ number: 10 })]);
		setIssueListSnapshot('org_1', 'closed', [mockIssue({ number: 20, status: 'closed' })]);

		expect(getIssueSnapshot('org_1', 10)?.number).toBe(10);
		expect(getIssueSnapshot('org_1', 20)?.number).toBe(20);
	});

	it('returns undefined for a missing issue', () => {
		setIssueListSnapshot('org_1', 'open', [mockIssue({ number: 1 })]);
		expect(getIssueSnapshot('org_1', 999)).toBeUndefined();
	});

	it('does not find issues from a different org', () => {
		setIssueListSnapshot('org_1', 'open', [mockIssue({ number: 1 })]);
		expect(getIssueSnapshot('org_2', 1)).toBeUndefined();
	});

	it('returns undefined when cache is empty', () => {
		expect(getIssueSnapshot('org_1', 1)).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// clearIssueSnapshots
// ---------------------------------------------------------------------------
describe('clearIssueSnapshots', () => {
	it('removes all cached snapshots', () => {
		setIssueListSnapshot('org_1', 'open', [mockIssue({ number: 1 })]);
		setIssueListSnapshot('org_2', 'closed', [mockIssue({ number: 2 })]);

		clearIssueSnapshots();

		expect(getIssueListSnapshot('org_1', 'open')).toBeUndefined();
		expect(getIssueListSnapshot('org_2', 'closed')).toBeUndefined();
		expect(getIssueSnapshot('org_1', 1)).toBeUndefined();
	});
});

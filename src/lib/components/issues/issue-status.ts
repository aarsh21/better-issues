export type IssueStatus = 'open' | 'in_progress' | 'closed';

export const ISSUE_STATUSES = new Set<IssueStatus>(['open', 'in_progress', 'closed']);

export function parseIssueStatusParam(value: string | null): IssueStatus | undefined {
	if (value === 'open' || value === 'in_progress' || value === 'closed') {
		return value;
	}
	return undefined;
}

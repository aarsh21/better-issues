import type { Doc } from "@/convex";

type Issue = Doc<"issues">;
type IssueStatusFilter = Issue["status"] | undefined;

const ALL_STATUSES_KEY = "all";
const issueListSnapshots = new Map<string, Issue[]>();

const buildListSnapshotKey = (organizationId: string, status: IssueStatusFilter) =>
  `${organizationId}:${status ?? ALL_STATUSES_KEY}`;

export const getIssueListSnapshot = (organizationId: string, status: IssueStatusFilter) =>
  issueListSnapshots.get(buildListSnapshotKey(organizationId, status));

export const setIssueListSnapshot = (
  organizationId: string,
  status: IssueStatusFilter,
  issues: Issue[],
) => {
  issueListSnapshots.set(buildListSnapshotKey(organizationId, status), [...issues]);
};

export const getIssueSnapshot = (organizationId: string, issueNumber: number) => {
  const orgPrefix = `${organizationId}:`;

  for (const [key, issues] of issueListSnapshots) {
    if (!key.startsWith(orgPrefix)) {
      continue;
    }

    const match = issues.find((issue) => issue.number === issueNumber);
    if (match) {
      return match;
    }
  }

  return undefined;
};

export const DEFAULT_LABELS: ReadonlyArray<{
  readonly name: string;
  readonly color: string;
  readonly description?: string;
}> = [
  {
    name: "bug",
    color: "#ef4444",
    description: "Something is not working",
  },
  {
    name: "documentation",
    color: "#3b82f6",
    description: "Improvements or additions to docs",
  },
  {
    name: "duplicate",
    color: "#6b7280",
    description: "This issue or pull request already exists",
  },
  {
    name: "enhancement",
    color: "#22c55e",
    description: "New feature or request",
  },
  {
    name: "good first issue",
    color: "#7057ff",
    description: "Good for newcomers",
  },
  {
    name: "help wanted",
    color: "#06b6d4",
    description: "Extra attention is needed",
  },
  {
    name: "invalid",
    color: "#eab308",
    description: "This does not seem right",
  },
  {
    name: "question",
    color: "#d876e3",
    description: "Further information is requested",
  },
  {
    name: "wontfix",
    color: "#1e293b",
    description: "This will not be worked on",
  },
] as const;

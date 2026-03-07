import { queryOptions } from "@tanstack/react-query";
import { treaty } from "@elysiajs/eden";

import { env } from "@better-issues/env/web";

export * from "./contracts";
import type {
  AttachmentDto,
  CursorPage,
  IssueDetailDto,
  IssueListItemDto,
  LabelDto,
  SessionDto,
  TemplateDto,
} from "./contracts";

const getBaseUrl = () => {
  if (typeof window === "undefined") {
    return env.API_URL;
  }

  return window.location.origin;
};

export const apiClient: any = treaty<any>(getBaseUrl(), {
  fetch: {
    credentials: "include",
  },
});

const unwrap = async <T>(
  request: Promise<{ data: T | null; error: unknown; status: number }>,
): Promise<T> => {
  const response = await request;
  if (response.error) {
    throw new Error(
      typeof response.error === "object" &&
        response.error &&
        "value" in response.error &&
        typeof (response.error as { value?: { message?: string } }).value?.message === "string"
        ? (response.error as { value: { message: string } }).value.message
        : "Request failed",
    );
  }

  if (response.data === null) {
    throw new Error("Empty response");
  }

  return response.data;
};

export const sessionKeys = {
  all: ["session"] as const,
};

export const labelKeys = {
  all: ["labels"] as const,
  list: (organizationId: string) => [...labelKeys.all, organizationId] as const,
};

export const templateKeys = {
  all: ["templates"] as const,
  list: (organizationId: string) => [...templateKeys.all, organizationId] as const,
  detail: (templateId: string) => ["template", templateId] as const,
};

export const issueKeys = {
  all: ["issues"] as const,
  list: (organizationId: string, filters: Record<string, unknown>) =>
    [...issueKeys.all, organizationId, filters] as const,
  detail: (organizationId: string, number: number) => ["issue", organizationId, number] as const,
};

export const attachmentKeys = {
  all: ["attachments"] as const,
  list: (issueId: string) => [...attachmentKeys.all, issueId] as const,
};

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: sessionKeys.all,
    queryFn: () => unwrap<SessionDto>(apiClient.api.v1.me.get()),
    staleTime: 30_000,
  });

export const labelsQueryOptions = (organizationId: string) =>
  queryOptions({
    queryKey: labelKeys.list(organizationId),
    queryFn: () =>
      unwrap<LabelDto[]>(
        apiClient.api.v1.labels.get({
          query: {
            organizationId,
          },
        }),
      ),
    staleTime: 30_000,
  });

export const templatesQueryOptions = (organizationId: string) =>
  queryOptions({
    queryKey: templateKeys.list(organizationId),
    queryFn: () =>
      unwrap<TemplateDto[]>(
        apiClient.api.v1.templates.get({
          query: {
            organizationId,
          },
        }),
      ),
    staleTime: 30_000,
  });

export const templateQueryOptions = (templateId: string) =>
  queryOptions({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => unwrap<TemplateDto>(apiClient.api.v1.templates({ templateId }).get()),
    staleTime: 30_000,
  });

export const issuesQueryOptions = (params: {
  organizationId: string;
  cursor?: string | null;
  status?: string;
  assigneeId?: string;
  labelId?: string;
  q?: string;
}) =>
  queryOptions({
    queryKey: issueKeys.list(params.organizationId, params),
    queryFn: () =>
      unwrap<CursorPage<IssueListItemDto>>(
        apiClient.api.v1.issues.get({
          query: {
            organizationId: params.organizationId,
            cursor: params.cursor ?? undefined,
            status: params.status,
            assigneeId: params.assigneeId,
            labelId: params.labelId,
            q: params.q,
          },
        }),
      ),
    staleTime: 10_000,
  });

export const issueByNumberQueryOptions = (organizationId: string, number: number) =>
  queryOptions({
    queryKey: issueKeys.detail(organizationId, number),
    queryFn: () =>
      unwrap<IssueDetailDto | null>(
        apiClient.api.v1.issues["by-number"].get({
          query: {
            organizationId,
            number,
          },
        }),
      ),
    staleTime: 10_000,
  });

export const issueAttachmentsQueryOptions = (issueId: string) =>
  queryOptions({
    queryKey: attachmentKeys.list(issueId),
    queryFn: () => unwrap<AttachmentDto[]>(apiClient.api.v1.issues({ issueId }).attachments.get()),
    staleTime: 10_000,
  });

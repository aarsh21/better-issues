import { queryOptions } from "@tanstack/react-query";
import { treaty } from "@elysiajs/eden";

import { env } from "@better-issues/env/web";

export * from "./contracts";
import type {
  AttachmentDto,
  CursorPage,
  IssuePriority,
  IssueDetailDto,
  IssueListItemDto,
  IssueStatus,
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

type ErrorResponseBody = {
  message?: string;
};

type ApiResponse<T> =
  | {
      data: T;
      error: null;
      headers: ResponseInit["headers"];
      response: Response;
      status: number;
    }
  | {
      data: null;
      error: {
        status: number;
        value: ErrorResponseBody;
      };
      headers: ResponseInit["headers"];
      response: Response;
      status: number;
    };

type ApiRequest<T> = Promise<ApiResponse<T>>;

type UpdateProfileInput = {
  image?: string | null;
  name?: string;
  username?: string | null;
};

type LabelMutationInput = {
  color: string;
  description?: string | null;
  name: string;
  organizationId: string;
};

type UpdateLabelInput = {
  color?: string;
  description?: string | null;
  name?: string;
};

type TemplateMutationInput = {
  description: string;
  name: string;
  organizationId: string;
  schema: string;
};

type UpdateTemplateInput = {
  description?: string;
  name?: string;
  schema?: string;
};

type IssueListQuery = {
  assigneeId?: string;
  cursor?: string;
  labelId?: string;
  organizationId: string;
  q?: string;
  status?: string;
};

type CreateIssueInput = {
  assigneeId?: string | null;
  attachmentIds: string[];
  description?: string | null;
  labelIds: string[];
  organizationId: string;
  priority: IssuePriority;
  templateData?: string | null;
  templateId?: string | null;
  title: string;
};

type UpdateIssueInput = {
  description?: string | null;
  labelIds?: string[];
  priority?: IssuePriority;
  templateData?: string | null;
  title?: string;
};

type UpdateIssueStatusInput = {
  status: IssueStatus;
};

type ApiClient = {
  api: {
    v1: {
      attachments: (params: { attachmentId: string }) => {
        delete: () => ApiRequest<{ ok: true }>;
      };
      issues: {
        "by-number": {
          get: (options: {
            query: {
              number: number;
              organizationId: string;
            };
          }) => ApiRequest<IssueDetailDto | null>;
        };
        get: (options: { query: IssueListQuery }) => ApiRequest<CursorPage<IssueListItemDto>>;
        post: (body: CreateIssueInput) => ApiRequest<{ issueId: string; number: number }>;
      } & ((params: { issueId: string }) => {
        attachments: {
          get: () => ApiRequest<AttachmentDto[]>;
        };
        delete: () => ApiRequest<{ ok: true }>;
        patch: (body: UpdateIssueInput) => ApiRequest<IssueDetailDto>;
        status: {
          post: (body: UpdateIssueStatusInput) => ApiRequest<{ ok: true }>;
        };
      });
      labels: {
        get: (options: {
          query: {
            organizationId: string;
          };
        }) => ApiRequest<LabelDto[]>;
        post: (body: LabelMutationInput) => ApiRequest<LabelDto>;
      } & ((params: { labelId: string }) => {
        delete: () => ApiRequest<{ ok: true }>;
        patch: (body: UpdateLabelInput) => ApiRequest<LabelDto>;
      });
      me: {
        get: () => ApiRequest<SessionDto>;
        profile: {
          patch: (body: UpdateProfileInput) => ApiRequest<SessionDto>;
        };
      };
      templates: {
        get: (options: {
          query: {
            organizationId: string;
          };
        }) => ApiRequest<TemplateDto[]>;
        post: (body: TemplateMutationInput) => ApiRequest<TemplateDto>;
      } & ((params: { templateId: string }) => {
        delete: () => ApiRequest<{ ok: true }>;
        get: () => ApiRequest<TemplateDto>;
        patch: (body: UpdateTemplateInput) => ApiRequest<TemplateDto>;
      });
    };
  };
};

export const apiClient = treaty(getBaseUrl(), {
  fetch: {
    credentials: "include",
  },
}) as unknown as ApiClient;

const unwrap = async <T>(request: ApiRequest<T>): Promise<T> => {
  const response = await request;
  if (response.error) {
    throw new Error(
      typeof response.error.value?.message === "string"
        ? response.error.value.message
        : "Request failed",
    );
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

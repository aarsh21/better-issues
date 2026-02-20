import type { QueryClient } from "@tanstack/react-query";

import { convexQuery } from "@convex-dev/react-query";

import { api } from "@/convex";
import {
  activeOrganizationQueryOptions,
  organizationsQueryOptions,
} from "@/hooks/use-organization";

const ISSUE_NEW_PATH = /^\/org\/([^/]+)\/issues\/new$/;
const ISSUE_DETAIL_PATH = /^\/org\/([^/]+)\/issues\/(\d+)$/;
const SETTINGS_PATH = /^\/org\/([^/]+)\/settings(?:\/.*)?$/;
const ISSUE_LIST_PATH = /^\/org\/([^/]+)\/?$/;

const prefetchTimestamps = new Map<string, number>();
const PREFETCH_COOLDOWN_MS = 30_000;

const markPrefetched = (key: string) => {
  prefetchTimestamps.set(key, Date.now());
};

const shouldPrefetch = (key: string) => {
  const prefetchedAt = prefetchTimestamps.get(key);
  return prefetchedAt === undefined || Date.now() - prefetchedAt > PREFETCH_COOLDOWN_MS;
};

const normalizeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

const getPathname = (href: string) => {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return null;
  }
};

const resolveOrganizationForSlug = async (slug: string, queryClient: QueryClient) => {
  const normalizedSlug = normalizeSlug(slug);

  const [activeOrg, organizations] = await Promise.all([
    queryClient.ensureQueryData(activeOrganizationQueryOptions()),
    queryClient.ensureQueryData(organizationsQueryOptions()),
  ]);

  if (activeOrg?.slug === normalizedSlug) {
    return activeOrg;
  }

  return organizations.find((organization) => organization.slug === normalizedSlug) ?? null;
};

export async function prefetchOrgRouteData(pathname: string, queryClient: QueryClient) {
  if (typeof window === "undefined") {
    return;
  }

  if (!pathname.startsWith("/org/")) {
    return;
  }

  const prefetch = async (query: ReturnType<typeof convexQuery>) =>
    queryClient.prefetchQuery(query);

  const issueNewMatch = ISSUE_NEW_PATH.exec(pathname);
  if (issueNewMatch && shouldPrefetch(pathname)) {
    const organization = await resolveOrganizationForSlug(issueNewMatch[1] ?? "", queryClient);
    if (!organization) {
      return;
    }

    markPrefetched(pathname);
    await Promise.allSettled([
      prefetch(convexQuery(api.labels.list, { organizationId: organization.id })),
      prefetch(convexQuery(api.templates.list, { organizationId: organization.id })),
    ]);
    return;
  }

  const issueDetailMatch = ISSUE_DETAIL_PATH.exec(pathname);
  if (issueDetailMatch && shouldPrefetch(pathname)) {
    const organization = await resolveOrganizationForSlug(issueDetailMatch[1] ?? "", queryClient);
    if (!organization) {
      return;
    }

    const issueNumber = Number.parseInt(issueDetailMatch[2] ?? "", 10);
    if (!Number.isNaN(issueNumber)) {
      markPrefetched(pathname);
      const issue = await queryClient.fetchQuery(
        convexQuery(api.issues.getByNumber, {
          organizationId: organization.id,
          number: issueNumber,
        }),
      );

      const followUpPrefetches = [
        prefetch(convexQuery(api.labels.list, { organizationId: organization.id })),
      ];

      if (issue?.templateId) {
        followUpPrefetches.push(
          prefetch(
            convexQuery(api.templates.get, {
              templateId: issue.templateId,
            }),
          ),
        );
      }

      await Promise.allSettled(followUpPrefetches);
    }
    return;
  }

  const settingsMatch = SETTINGS_PATH.exec(pathname);
  if (settingsMatch && shouldPrefetch(pathname)) {
    const organization = await resolveOrganizationForSlug(settingsMatch[1] ?? "", queryClient);
    if (!organization) {
      return;
    }

    markPrefetched(pathname);
    await Promise.allSettled([
      prefetch(convexQuery(api.labels.list, { organizationId: organization.id })),
      prefetch(convexQuery(api.templates.list, { organizationId: organization.id })),
    ]);
    return;
  }

  const issueListMatch = ISSUE_LIST_PATH.exec(pathname);
  if (issueListMatch && shouldPrefetch(pathname)) {
    const organization = await resolveOrganizationForSlug(issueListMatch[1] ?? "", queryClient);
    if (!organization) {
      return;
    }

    markPrefetched(pathname);
    await prefetch(convexQuery(api.labels.list, { organizationId: organization.id }));
  }
}

export async function prefetchRouteData(href: string, queryClient: QueryClient) {
  if (typeof window === "undefined") {
    return;
  }

  if (!href.startsWith("/org/")) {
    return;
  }

  const pathname = getPathname(href);
  if (!pathname) {
    return;
  }

  await prefetchOrgRouteData(pathname, queryClient);
}

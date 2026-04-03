import { env } from "$env/dynamic/private";
import { createConvexHttpClient } from "@mmailaender/convex-better-auth-svelte/sveltekit";

import { api } from "$convex/_generated/api";
import { publicEnv } from "$lib/public-env";

import type { OrganizationSummary } from "$lib/organization";

export type InvitationSummary = {
  id: string;
  status: string;
  role?: string | null;
  expiresAt: number;
  organizationName?: string;
};

export type ResolvedOrg = {
  organization: OrganizationSummary;
  membership: { role: string };
};

const getClient = () => {
  const convexUrl = env.CONVEX_URL ?? publicEnv.convexUrl;
  return createConvexHttpClient({ convexUrl });
};

/**
 * Resolve an organization by slug and verify the current user is a member.
 * Returns null when the org doesn't exist or the user isn't a member.
 */
export const resolveOrgBySlug = async (
  slug: string,
): Promise<ResolvedOrg | null> => {
  if (env.E2E_MOCK_AUTH === "true") {
    return null;
  }

  const client = getClient();
  return await client.query(api.organizations.resolveBySlug, { slug });
};

/**
 * List all organizations the current user belongs to.
 */
export const listUserOrganizations = async (): Promise<
  OrganizationSummary[]
> => {
  if (env.E2E_MOCK_AUTH === "true") {
    return [];
  }

  const client = getClient();
  return await client.query(api.organizations.listForCurrentUser, {});
};

/**
 * Fetch a public invitation summary by ID.
 * Does not require authentication — safe for the signed-out invite landing.
 */
export const getInvitationSummary = async (
  invitationId: string,
): Promise<InvitationSummary | null> => {
  if (env.E2E_MOCK_AUTH === "true") {
    return null;
  }

  const client = getClient();
  return await client.query(api.invitations.getSummary, { invitationId });
};

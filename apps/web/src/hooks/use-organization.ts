import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

// ─── Query Key Factory ──────────────────────────────────────────

export const orgKeys = {
  all: ["organization"] as const,
  lists: () => [...orgKeys.all, "list"] as const,
  active: () => [...orgKeys.all, "active"] as const,
  membersRoot: () => [...orgKeys.all, "members"] as const,
  members: (organizationId?: string) => [...orgKeys.membersRoot(), organizationId] as const,
  invitationsRoot: () => [...orgKeys.all, "invitations"] as const,
  invitations: (organizationId?: string) => [...orgKeys.invitationsRoot(), organizationId] as const,
  invitation: (invitationId: string) => [...orgKeys.all, "invitation", invitationId] as const,
  userInvitations: () => [...orgKeys.all, "userInvitations"] as const,
};

export const organizationsQueryOptions = () => ({
  queryKey: orgKeys.lists(),
  queryFn: async () => {
    const { data, error } = await authClient.organization.list();
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const activeOrganizationQueryOptions = () => ({
  queryKey: orgKeys.active(),
  queryFn: async () => {
    const { data, error } = await authClient.organization.getFullOrganization();
    if (error) throw error;
    return data ?? null;
  },
  staleTime: 60_000,
});

// ─── Types ───────────────────────────────────────────────────────

type Member = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  inviterEmail?: string;
};

// ─── Queries ─────────────────────────────────────────────────────

/**
 * Fetches the list of organizations the current user belongs to.
 * Uses a 30s stale time so navigating between pages doesn't re-fetch.
 */
export function useOrganizations() {
  return useQuery(organizationsQueryOptions());
}

/**
 * Returns the currently active organization from the session.
 * Cached with a 60s stale time. Components can read this without
 * triggering additional network requests.
 */
export function useActiveOrganization() {
  return useQuery(activeOrganizationQueryOptions());
}

/**
 * Fetches members of a given organization (or the active one).
 * Only enabled when an organizationId is provided.
 */
export function useMembers(organizationId?: string) {
  return useQuery({
    queryKey: orgKeys.members(organizationId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers();
      if (error) throw error;
      return (data?.members ?? []) as Member[];
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

/**
 * Sets the active organization in the session and updates the
 * TanStack Query cache so all consumers see the new org immediately.
 */
export function useSetActiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params:
        | { organizationId: string; organizationSlug?: never }
        | { organizationSlug: string; organizationId?: never },
    ) => {
      const { data, error } = await authClient.organization.setActive(params);
      if (error) throw error;
      return data;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: orgKeys.active() });

      const previousActiveOrganization = queryClient.getQueryData(orgKeys.active());
      const organizations =
        queryClient.getQueryData<Array<{ id: string; slug: string; name: string }>>(
          orgKeys.lists(),
        ) ?? [];

      const optimisticActiveOrganization =
        "organizationId" in params
          ? organizations.find((organization) => organization.id === params.organizationId)
          : organizations.find((organization) => organization.slug === params.organizationSlug);

      if (optimisticActiveOrganization) {
        queryClient.setQueryData(orgKeys.active(), optimisticActiveOrganization);
      }

      return { previousActiveOrganization };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousActiveOrganization !== undefined) {
        queryClient.setQueryData(orgKeys.active(), context.previousActiveOrganization);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.active() });
    },
  });
}

/**
 * Creates a new organization, then invalidates the list cache
 * so the switcher picks it up.
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; slug: string }) => {
      const { data, error } = await authClient.organization.create(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

/**
 * Invites a member to the active organization.
 * Invalidates the members and invitations cache on success.
 * Returns the invitation data (including id) for link construction.
 */
type OrgRole = "member" | "owner" | "admin";

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { email: string; role: OrgRole }) => {
      const { data, error } = await authClient.organization.inviteMember(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.membersRoot() });
      queryClient.invalidateQueries({ queryKey: orgKeys.invitationsRoot() });
    },
  });
}

/**
 * Removes a member from the active organization.
 * Optimistically removes the member from the cache.
 */
export function useRemoveMember(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { memberIdOrEmail: string }) => {
      const { data, error } = await authClient.organization.removeMember(params);
      if (error) throw error;
      return data;
    },
    onMutate: async ({ memberIdOrEmail }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: orgKeys.members(organizationId),
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Member[]>(orgKeys.members(organizationId));

      // Optimistically remove the member
      if (previous) {
        queryClient.setQueryData(
          orgKeys.members(organizationId),
          previous.filter((m) => m.user.email !== memberIdOrEmail && m.id !== memberIdOrEmail),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(orgKeys.members(organizationId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.members(organizationId),
      });
    },
  });
}

// ─── Invitation Queries ──────────────────────────────────────────

/**
 * Fetches pending invitations for the given organization.
 * Only enabled when organizationId is provided.
 */
export function useInvitations(organizationId?: string) {
  return useQuery({
    queryKey: orgKeys.invitations(organizationId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations();
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}

/**
 * Fetches a single invitation by ID (for the accept/reject page).
 */
export function useInvitation(invitationId: string) {
  return useQuery({
    queryKey: orgKeys.invitation(invitationId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });
      if (error) throw error;
      return data as Invitation | null;
    },
    enabled: !!invitationId,
    staleTime: 60_000,
  });
}

/**
 * Fetches all invitations addressed to the currently signed-in user.
 */
export function useUserInvitations() {
  return useQuery({
    queryKey: orgKeys.userInvitations(),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listUserInvitations();
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
    staleTime: 30_000,
  });
}

// ─── Invitation Mutations ────────────────────────────────────────

/**
 * Accepts an invitation. Invalidates user invitations, members, and org list.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { invitationId: string }) => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId: params.invitationId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.userInvitations() });
      queryClient.invalidateQueries({ queryKey: orgKeys.membersRoot() });
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orgKeys.active() });
    },
  });
}

/**
 * Rejects an invitation. Invalidates user invitations.
 */
export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { invitationId: string }) => {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId: params.invitationId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.userInvitations() });
    },
  });
}

/**
 * Cancels a pending invitation (admin/owner action).
 * Optimistically removes the invitation from the cache.
 */
export function useCancelInvitation(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { invitationId: string }) => {
      const { data, error } = await authClient.organization.cancelInvitation({
        invitationId: params.invitationId,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ invitationId }) => {
      await queryClient.cancelQueries({
        queryKey: orgKeys.invitations(organizationId),
      });

      const previous = queryClient.getQueryData<Invitation[]>(orgKeys.invitations(organizationId));

      if (previous) {
        queryClient.setQueryData(
          orgKeys.invitations(organizationId),
          previous.filter((inv) => inv.id !== invitationId),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(orgKeys.invitations(organizationId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.invitations(organizationId),
      });
    },
  });
}

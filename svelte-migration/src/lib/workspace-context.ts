import { getContext, setContext } from 'svelte';

import type { ActiveOrganization, OrganizationSummary } from '$lib/organization';

export const WORKSPACE_CONTEXT_KEY = Symbol('workspace');

export type WorkspaceState = {
	organizations: OrganizationSummary[] | null;
	activeOrg: ActiveOrganization | null;
	organizationId: string | undefined;
};

export function setWorkspaceContext(state: WorkspaceState): void {
	setContext(WORKSPACE_CONTEXT_KEY, state);
}

export function getWorkspace(): WorkspaceState {
	return getContext(WORKSPACE_CONTEXT_KEY);
}

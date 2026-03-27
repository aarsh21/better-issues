import { authClient } from "./auth-client";

export type OrganizationSummary = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
};

export type ActiveOrganization = OrganizationSummary & {
	createdAt?: Date | string;
	metadata?: Record<string, unknown> | null;
};

export type InvitationStatus = "pending" | "accepted" | "rejected" | "canceled";

export type OrganizationInvitation = {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: InvitationStatus;
	expiresAt?: Date | string | null;
	inviterEmail?: string;
	organizationName?: string;
};

export type OrganizationMember = {
	id: string;
	role: string;
	user: {
		id: string;
		name?: string | null;
		email: string;
		image?: string | null;
	};
};

type AuthResult<Data> = {
	data?: Data | null;
	error?: { message?: string | undefined } | Error | null;
};

const unwrapAuthResult = <Data>(result: AuthResult<Data>, fallbackMessage: string) => {
	if (result.error) {
		throw result.error instanceof Error
			? result.error
			: new Error(result.error.message ?? fallbackMessage);
	}

	return result.data ?? null;
};

export const slugifyOrganizationName = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

export const listOrganizations = async () => {
	const data = unwrapAuthResult(
		await authClient.organization.list(),
		"Failed to load teams."
	) as OrganizationSummary[] | null;

	return data ?? [];
};

export const getActiveOrganization = async () => {
	return unwrapAuthResult(
		await authClient.organization.getFullOrganization(),
		"Failed to load the active team."
	) as ActiveOrganization | null;
};

export const setActiveOrganization = async (
	params:
		| { organizationId: string; organizationSlug?: never }
		| { organizationSlug: string; organizationId?: never }
) => {
	return unwrapAuthResult(
		await authClient.organization.setActive(params),
		"Failed to switch teams."
	);
};

export const createOrganization = async (params: { name: string; slug: string }) => {
	return unwrapAuthResult(
		await authClient.organization.create(params),
		"Failed to create team."
	) as OrganizationSummary | null;
};

export const getInvitation = async (invitationId: string) => {
	return unwrapAuthResult(
		await authClient.organization.getInvitation({
			query: { id: invitationId }
		}),
		"Failed to load invitation."
	) as OrganizationInvitation | null;
};

export const acceptInvitation = async (invitationId: string) => {
	return unwrapAuthResult(
		await authClient.organization.acceptInvitation({ invitationId }),
		"Failed to accept invitation."
	);
};

export const rejectInvitation = async (invitationId: string) => {
	return unwrapAuthResult(
		await authClient.organization.rejectInvitation({ invitationId }),
		"Failed to decline invitation."
	);
};

export const listMembers = async () => {
	const data = unwrapAuthResult(
		await authClient.organization.listMembers(),
		"Failed to load members."
	) as { members?: OrganizationMember[] | null } | null;

	return data?.members ?? [];
};

export const listInvitations = async () => {
	const data = unwrapAuthResult(
		await authClient.organization.listInvitations(),
		"Failed to load invitations."
	) as OrganizationInvitation[] | null;

	return data ?? [];
};

export const inviteMember = async (params: { email: string; role: "member" | "admin" }) => {
	return unwrapAuthResult(
		await authClient.organization.inviteMember(params),
		"Failed to invite member."
	) as { id?: string; invitationId?: string } | null;
};

export const removeMember = async (params: { memberIdOrEmail: string }) => {
	return unwrapAuthResult(
		await authClient.organization.removeMember(params),
		"Failed to remove member."
	);
};

export const cancelInvitation = async (params: { invitationId: string }) => {
	return unwrapAuthResult(
		await authClient.organization.cancelInvitation(params),
		"Failed to cancel invitation."
	);
};

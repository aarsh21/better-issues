import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('$lib/auth-client', () => ({
	authClient: {
		organization: {
			list: vi.fn(),
			getFullOrganization: vi.fn(),
			setActive: vi.fn(),
			create: vi.fn(),
			getInvitation: vi.fn(),
			acceptInvitation: vi.fn(),
			rejectInvitation: vi.fn(),
			listMembers: vi.fn(),
			listInvitations: vi.fn(),
			inviteMember: vi.fn(),
			removeMember: vi.fn(),
			cancelInvitation: vi.fn()
		}
	}
}));

import { authClient } from '$lib/auth-client';
import {
	slugifyOrganizationName,
	listOrganizations,
	getActiveOrganization,
	setActiveOrganization,
	createOrganization,
	getInvitation,
	acceptInvitation,
	rejectInvitation,
	listMembers,
	listInvitations,
	inviteMember,
	removeMember,
	cancelInvitation
} from './organization';

const org = authClient.organization;

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// slugifyOrganizationName
// ---------------------------------------------------------------------------
describe('slugifyOrganizationName', () => {
	it('lowercases and replaces spaces with hyphens', () => {
		expect(slugifyOrganizationName('My Team')).toBe('my-team');
	});

	it('removes non-alphanumeric characters', () => {
		expect(slugifyOrganizationName('Hello World!')).toBe('hello-world');
	});

	it('trims whitespace', () => {
		expect(slugifyOrganizationName('  spaces  ')).toBe('spaces');
	});

	it('returns empty string for empty input', () => {
		expect(slugifyOrganizationName('')).toBe('');
	});

	it('strips leading and trailing hyphens', () => {
		expect(slugifyOrganizationName('---abc---')).toBe('abc');
	});
});

// ---------------------------------------------------------------------------
// listOrganizations
// ---------------------------------------------------------------------------
describe('listOrganizations', () => {
	it('returns organizations on success', async () => {
		const orgs = [{ id: '1', name: 'Team A', slug: 'team-a' }];
		vi.mocked(org.list).mockResolvedValue({ data: orgs });
		const result = await listOrganizations();
		expect(result).toEqual(orgs);
	});

	it('returns empty array when data is null', async () => {
		vi.mocked(org.list).mockResolvedValue({ data: null });
		const result = await listOrganizations();
		expect(result).toEqual([]);
	});

	it('throws on error', async () => {
		vi.mocked(org.list).mockResolvedValue({ error: { message: 'boom' } });
		await expect(listOrganizations()).rejects.toThrow('boom');
	});
});

// ---------------------------------------------------------------------------
// getActiveOrganization
// ---------------------------------------------------------------------------
describe('getActiveOrganization', () => {
	it('returns organization on success', async () => {
		const active = { id: '1', name: 'Team A', slug: 'team-a' };
		vi.mocked(org.getFullOrganization).mockResolvedValue({ data: active });
		const result = await getActiveOrganization();
		expect(result).toEqual(active);
	});

	it('returns null when data is null', async () => {
		vi.mocked(org.getFullOrganization).mockResolvedValue({ data: null });
		const result = await getActiveOrganization();
		expect(result).toBeNull();
	});

	it('throws on error', async () => {
		vi.mocked(org.getFullOrganization).mockResolvedValue({
			error: { message: 'load failed' }
		});
		await expect(getActiveOrganization()).rejects.toThrow('load failed');
	});
});

// ---------------------------------------------------------------------------
// setActiveOrganization
// ---------------------------------------------------------------------------
describe('setActiveOrganization', () => {
	it('calls setActive with organizationId', async () => {
		vi.mocked(org.setActive).mockResolvedValue({ data: { id: '1' } });
		await setActiveOrganization({ organizationId: '1' });
		expect(org.setActive).toHaveBeenCalledWith({ organizationId: '1' });
	});

	it('calls setActive with organizationSlug', async () => {
		vi.mocked(org.setActive).mockResolvedValue({ data: { id: '2' } });
		await setActiveOrganization({ organizationSlug: 'team-b' });
		expect(org.setActive).toHaveBeenCalledWith({ organizationSlug: 'team-b' });
	});

	it('throws on error', async () => {
		vi.mocked(org.setActive).mockResolvedValue({
			error: { message: 'switch failed' }
		});
		await expect(setActiveOrganization({ organizationId: '1' })).rejects.toThrow('switch failed');
	});
});

// ---------------------------------------------------------------------------
// createOrganization
// ---------------------------------------------------------------------------
describe('createOrganization', () => {
	it('returns created organization on success', async () => {
		const created = { id: '3', name: 'New Team', slug: 'new-team' };
		vi.mocked(org.create).mockResolvedValue({ data: created });
		const result = await createOrganization({ name: 'New Team', slug: 'new-team' });
		expect(result).toEqual(created);
		expect(org.create).toHaveBeenCalledWith({ name: 'New Team', slug: 'new-team' });
	});

	it('throws on error', async () => {
		vi.mocked(org.create).mockResolvedValue({
			error: { message: 'create failed' }
		});
		await expect(createOrganization({ name: 'Fail', slug: 'fail' })).rejects.toThrow(
			'create failed'
		);
	});
});

// ---------------------------------------------------------------------------
// getInvitation
// ---------------------------------------------------------------------------
describe('getInvitation', () => {
	it('returns invitation on success', async () => {
		const invitation = {
			id: 'inv-1',
			organizationId: 'org-1',
			email: 'a@b.com',
			role: 'member',
			status: 'pending'
		};
		vi.mocked(org.getInvitation).mockResolvedValue({ data: invitation });
		const result = await getInvitation('inv-1');
		expect(result).toEqual(invitation);
		expect(org.getInvitation).toHaveBeenCalledWith({ query: { id: 'inv-1' } });
	});

	it('throws on error', async () => {
		vi.mocked(org.getInvitation).mockResolvedValue({
			error: { message: 'not found' }
		});
		await expect(getInvitation('inv-x')).rejects.toThrow('not found');
	});
});

// ---------------------------------------------------------------------------
// acceptInvitation / rejectInvitation
// ---------------------------------------------------------------------------
describe('acceptInvitation', () => {
	it('calls with invitationId', async () => {
		vi.mocked(org.acceptInvitation).mockResolvedValue({ data: {} });
		await acceptInvitation('inv-1');
		expect(org.acceptInvitation).toHaveBeenCalledWith({ invitationId: 'inv-1' });
	});

	it('throws on error', async () => {
		vi.mocked(org.acceptInvitation).mockResolvedValue({
			error: { message: 'accept failed' }
		});
		await expect(acceptInvitation('inv-1')).rejects.toThrow('accept failed');
	});
});

describe('rejectInvitation', () => {
	it('calls with invitationId', async () => {
		vi.mocked(org.rejectInvitation).mockResolvedValue({ data: {} });
		await rejectInvitation('inv-2');
		expect(org.rejectInvitation).toHaveBeenCalledWith({ invitationId: 'inv-2' });
	});

	it('throws on error', async () => {
		vi.mocked(org.rejectInvitation).mockResolvedValue({
			error: { message: 'reject failed' }
		});
		await expect(rejectInvitation('inv-2')).rejects.toThrow('reject failed');
	});
});

// ---------------------------------------------------------------------------
// listMembers
// ---------------------------------------------------------------------------
describe('listMembers', () => {
	it('unwraps nested members array', async () => {
		const members = [{ id: 'm1', role: 'admin', user: { id: 'u1', email: 'a@b.com' } }];
		vi.mocked(org.listMembers).mockResolvedValue({ data: { members } });
		const result = await listMembers();
		expect(result).toEqual(members);
	});

	it('returns empty array when data is null', async () => {
		vi.mocked(org.listMembers).mockResolvedValue({ data: null });
		const result = await listMembers();
		expect(result).toEqual([]);
	});

	it('returns empty array when members property is null', async () => {
		vi.mocked(org.listMembers).mockResolvedValue({ data: { members: null } });
		const result = await listMembers();
		expect(result).toEqual([]);
	});

	it('throws on error', async () => {
		vi.mocked(org.listMembers).mockResolvedValue({
			error: { message: 'members failed' }
		});
		await expect(listMembers()).rejects.toThrow('members failed');
	});
});

// ---------------------------------------------------------------------------
// listInvitations
// ---------------------------------------------------------------------------
describe('listInvitations', () => {
	it('returns invitations on success', async () => {
		const invitations = [
			{
				id: 'inv-1',
				organizationId: 'org-1',
				email: 'a@b.com',
				role: 'member',
				status: 'pending'
			}
		];
		vi.mocked(org.listInvitations).mockResolvedValue({ data: invitations });
		const result = await listInvitations();
		expect(result).toEqual(invitations);
	});

	it('returns empty array when data is null', async () => {
		vi.mocked(org.listInvitations).mockResolvedValue({ data: null });
		const result = await listInvitations();
		expect(result).toEqual([]);
	});

	it('throws on error', async () => {
		vi.mocked(org.listInvitations).mockResolvedValue({
			error: { message: 'invitations failed' }
		});
		await expect(listInvitations()).rejects.toThrow('invitations failed');
	});
});

// ---------------------------------------------------------------------------
// inviteMember
// ---------------------------------------------------------------------------
describe('inviteMember', () => {
	it('calls with correct params and returns result', async () => {
		vi.mocked(org.inviteMember).mockResolvedValue({ data: { id: 'inv-new' } });
		const result = await inviteMember({ email: 'new@b.com', role: 'member' });
		expect(result).toEqual({ id: 'inv-new' });
		expect(org.inviteMember).toHaveBeenCalledWith({ email: 'new@b.com', role: 'member' });
	});

	it('throws on error', async () => {
		vi.mocked(org.inviteMember).mockResolvedValue({
			error: { message: 'invite failed' }
		});
		await expect(inviteMember({ email: 'x@y.com', role: 'admin' })).rejects.toThrow(
			'invite failed'
		);
	});
});

// ---------------------------------------------------------------------------
// removeMember
// ---------------------------------------------------------------------------
describe('removeMember', () => {
	it('calls with correct params', async () => {
		vi.mocked(org.removeMember).mockResolvedValue({ data: {} });
		await removeMember({ memberIdOrEmail: 'u1' });
		expect(org.removeMember).toHaveBeenCalledWith({ memberIdOrEmail: 'u1' });
	});

	it('throws on error', async () => {
		vi.mocked(org.removeMember).mockResolvedValue({
			error: { message: 'remove failed' }
		});
		await expect(removeMember({ memberIdOrEmail: 'u1' })).rejects.toThrow('remove failed');
	});
});

// ---------------------------------------------------------------------------
// cancelInvitation
// ---------------------------------------------------------------------------
describe('cancelInvitation', () => {
	it('calls with correct params', async () => {
		vi.mocked(org.cancelInvitation).mockResolvedValue({ data: {} });
		await cancelInvitation({ invitationId: 'inv-1' });
		expect(org.cancelInvitation).toHaveBeenCalledWith({ invitationId: 'inv-1' });
	});

	it('throws on error', async () => {
		vi.mocked(org.cancelInvitation).mockResolvedValue({
			error: { message: 'cancel failed' }
		});
		await expect(cancelInvitation({ invitationId: 'inv-1' })).rejects.toThrow('cancel failed');
	});
});

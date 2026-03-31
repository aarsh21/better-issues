import { describe, expect, it, vi } from "vitest";

import { getOrgMember, requireOrgMembership, requirePermission } from "./permissions";

describe("permissions helpers", () => {
  it("queries Better Auth membership by user and organization", async () => {
    const runQuery = vi.fn().mockResolvedValue({
      _id: "member_1",
      organizationId: "org_1",
      userId: "user_1",
      role: "admin",
      createdAt: 1,
    });

    await expect(getOrgMember({ runQuery } as never, "user_1", "org_1")).resolves.toMatchObject({
      organizationId: "org_1",
      role: "admin",
      userId: "user_1",
    });

    expect(runQuery).toHaveBeenCalledWith(expect.anything(), {
      model: "member",
      where: [
        { field: "userId", value: "user_1" },
        { field: "organizationId", value: "org_1" },
      ],
    });
  });

  it("returns the membership record when the user belongs to the organization", async () => {
    const member = {
      _id: "member_1",
      organizationId: "org_1",
      userId: "user_1",
      role: "owner",
      createdAt: 1,
    };
    const ctx = {
      runQuery: vi.fn().mockResolvedValue(member),
    } as never;

    await expect(requireOrgMembership(ctx, "user_1", "org_1")).resolves.toEqual(member);
  });

  it("rejects users who are not organization members", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue(null),
    } as never;

    await expect(requireOrgMembership(ctx, "user_2", "org_1")).rejects.toThrow(
      "Not a member of this organization",
    );
  });

  it("rejects permission checks when the user is not a member", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue(null),
    } as never;

    await expect(requirePermission(ctx, "user_2", "org_1", "issue", "create")).rejects.toThrow(
      "Not a member of this organization",
    );
  });

  it("allows actions that the role can perform", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue({
        _id: "member_2",
        organizationId: "org_1",
        userId: "user_3",
        role: "member",
        createdAt: 1,
      }),
    } as never;

    await expect(
      requirePermission(ctx, "user_3", "org_1", "issue", "update"),
    ).resolves.toMatchObject({
      role: "member",
      userId: "user_3",
    });
  });

  it("allows admin-only label mutations", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue({
        _id: "member_3",
        organizationId: "org_1",
        userId: "user_4",
        role: "admin",
        createdAt: 1,
      }),
    } as never;

    await expect(
      requirePermission(ctx, "user_4", "org_1", "label", "delete"),
    ).resolves.toMatchObject({
      role: "admin",
    });
  });

  it("rejects actions outside the role permission set", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue({
        _id: "member_4",
        organizationId: "org_1",
        userId: "user_4",
        role: "member",
        createdAt: 1,
      }),
    } as never;

    await expect(requirePermission(ctx, "user_4", "org_1", "template", "delete")).rejects.toThrow(
      'Insufficient permissions: role "member" cannot delete template',
    );
  });

  it("rejects unknown roles", async () => {
    const ctx = {
      runQuery: vi.fn().mockResolvedValue({
        _id: "member_5",
        organizationId: "org_1",
        userId: "user_5",
        role: "viewer",
        createdAt: 1,
      }),
    } as never;

    await expect(requirePermission(ctx, "user_5", "org_1", "issue", "update")).rejects.toThrow(
      'Insufficient permissions: role "viewer" cannot update issue',
    );
  });
});

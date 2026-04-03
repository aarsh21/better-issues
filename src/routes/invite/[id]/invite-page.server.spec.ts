import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  getInvitationSummary: vi.fn(),
}));

vi.mock("$lib/server/auth", () => ({
  getOptionalUser: mocks.getOptionalUser,
}));

vi.mock("$lib/server/organization", () => ({
  getInvitationSummary: mocks.getInvitationSummary,
}));

import { load } from "./+page.server";

const fakeEvent = (id: string) =>
  ({ params: { id } }) as Parameters<typeof load>[0];

describe("invite page server load", () => {
  beforeEach(() => {
    mocks.getOptionalUser.mockReset();
    mocks.getInvitationSummary.mockReset();
  });

  it("returns invitation summary and auth state for a signed-in user", async () => {
    const user = { _id: "user_1" };
    const invitation = {
      id: "inv_1",
      status: "pending",
      role: "member",
      expiresAt: Date.now() + 86400000,
      organizationName: "Acme",
    };

    mocks.getOptionalUser.mockResolvedValue(user);
    mocks.getInvitationSummary.mockResolvedValue(invitation);

    const result = await load(fakeEvent("inv_1"));

    expect(result).toEqual({
      currentUser: user,
      invitation,
      isAuthenticated: true,
    });
  });

  it("allows signed-out users to see the invitation", async () => {
    const invitation = {
      id: "inv_2",
      status: "pending",
      role: "admin",
      expiresAt: Date.now() + 86400000,
      organizationName: "Acme",
    };

    mocks.getOptionalUser.mockResolvedValue(null);
    mocks.getInvitationSummary.mockResolvedValue(invitation);

    const result = await load(fakeEvent("inv_2"));

    expect(result).toEqual({
      currentUser: null,
      invitation,
      isAuthenticated: false,
    });
  });

  it("returns null invitation when not found", async () => {
    mocks.getOptionalUser.mockResolvedValue(null);
    mocks.getInvitationSummary.mockResolvedValue(null);

    const result = await load(fakeEvent("nonexistent"));

    expect(result).toEqual({
      currentUser: null,
      invitation: null,
      isAuthenticated: false,
    });
  });
});

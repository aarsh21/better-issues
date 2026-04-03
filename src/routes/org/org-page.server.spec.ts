import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  listUserOrganizations: vi.fn(),
}));

vi.mock("$lib/server/auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("$lib/server/organization", () => ({
  listUserOrganizations: mocks.listUserOrganizations,
}));

import { load } from "./+page.server";

describe("org landing server load", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.listUserOrganizations.mockReset();
  });

  it("returns the authenticated user and their organizations", async () => {
    const currentUser = { _id: "user_org" };
    const organizations = [{ id: "org_1", name: "Acme", slug: "acme" }];

    mocks.requireUser.mockResolvedValue(currentUser);
    mocks.listUserOrganizations.mockResolvedValue(organizations);

    await expect(load({} as Parameters<typeof load>[0])).resolves.toEqual({
      currentUser,
      organizations,
    });
  });
});

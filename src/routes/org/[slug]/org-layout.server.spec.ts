import { redirect } from "@sveltejs/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  resolveOrgBySlug: vi.fn(),
  listUserOrganizations: vi.fn(),
}));

vi.mock("$lib/server/auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("$lib/server/organization", () => ({
  resolveOrgBySlug: mocks.resolveOrgBySlug,
  listUserOrganizations: mocks.listUserOrganizations,
}));

import { load } from "./+layout.server";

const fakeEvent = (slug: string) =>
  ({ params: { slug } }) as Parameters<typeof load>[0];

const currentUser = { _id: "user_1", name: "Test" };
const org = { id: "org_1", name: "Acme", slug: "acme", logo: null };
const membership = { role: "owner" };

describe("org layout server load", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.resolveOrgBySlug.mockReset();
    mocks.listUserOrganizations.mockReset();
  });

  it("returns user, organization, membership, and organizations for valid slug", async () => {
    mocks.requireUser.mockResolvedValue(currentUser);
    mocks.resolveOrgBySlug.mockResolvedValue({ organization: org, membership });
    mocks.listUserOrganizations.mockResolvedValue([org]);

    const result = await load(fakeEvent("acme"));

    expect(result).toEqual({
      currentUser,
      organization: org,
      membership,
      organizations: [org],
    });
    expect(mocks.resolveOrgBySlug).toHaveBeenCalledWith("acme");
  });

  it("redirects to /org when slug is not found or user is not a member", async () => {
    mocks.requireUser.mockResolvedValue(currentUser);
    mocks.resolveOrgBySlug.mockResolvedValue(null);
    mocks.listUserOrganizations.mockResolvedValue([]);

    await expect(load(fakeEvent("unknown"))).rejects.toEqual(
      expect.objectContaining({
        status: 303,
        location: "/org",
      }),
    );
  });
});

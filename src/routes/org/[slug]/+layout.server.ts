import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";
import { requireUser } from "$lib/server/auth";
import {
  listUserOrganizations,
  resolveOrgBySlug,
} from "$lib/server/organization";

export const load: LayoutServerLoad = async ({ params }) => {
  const currentUser = await requireUser();

  const [resolved, organizations] = await Promise.all([
    resolveOrgBySlug(params.slug),
    listUserOrganizations(),
  ]);

  if (!resolved) {
    redirect(303, "/org");
  }

  return {
    currentUser,
    organization: resolved.organization,
    membership: resolved.membership,
    organizations,
  };
};

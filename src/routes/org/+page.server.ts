import type { PageServerLoad } from "./$types";
import { requireUser } from "$lib/server/auth";
import { listUserOrganizations } from "$lib/server/organization";

export const load: PageServerLoad = async () => {
  const currentUser = await requireUser();
  const organizations = await listUserOrganizations();

  return { currentUser, organizations };
};

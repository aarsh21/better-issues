import type { PageServerLoad } from "./$types";
import { getOptionalUser } from "$lib/server/auth";
import { getInvitationSummary } from "$lib/server/organization";

export const load: PageServerLoad = async ({ params }) => {
  const [currentUser, invitation] = await Promise.all([
    getOptionalUser(),
    getInvitationSummary(params.id),
  ]);

  return {
    currentUser: currentUser ?? null,
    invitation: invitation ?? null,
    isAuthenticated: currentUser !== null,
  };
};

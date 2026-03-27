import { redirect } from '@sveltejs/kit';

import { SIGN_IN_PATH } from '$lib/auth-routing';
import { redirectAuthenticatedUser } from '$lib/server/auth';

export const load = async () => {
	await redirectAuthenticatedUser();

	redirect(303, SIGN_IN_PATH);
};

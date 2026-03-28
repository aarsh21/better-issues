import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { SIGN_IN_PATH, getSafeReturnTo } from '$lib/auth-routing';
import { publicEnv } from '$lib/public-env';
import { redirectAuthenticatedUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	await redirectAuthenticatedUser();

	if (!publicEnv.allowSignups) {
		redirect(303, SIGN_IN_PATH);
	}

	return {
		returnTo: getSafeReturnTo(url.searchParams.get('returnTo'))
	};
};

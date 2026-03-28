import type { PageServerLoad } from './$types';
import { getSafeReturnTo } from '$lib/auth-routing';
import { redirectAuthenticatedUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	await redirectAuthenticatedUser();

	return {
		returnTo: getSafeReturnTo(url.searchParams.get('returnTo'))
	};
};

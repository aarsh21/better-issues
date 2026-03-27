import { getSafeReturnTo } from '$lib/auth-routing';
import { redirectAuthenticatedUser } from '$lib/server/auth';

export const load = async ({ url }) => {
	await redirectAuthenticatedUser();

	return {
		returnTo: getSafeReturnTo(url.searchParams.get('returnTo'))
	};
};

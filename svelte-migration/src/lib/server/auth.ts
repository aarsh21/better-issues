import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

import { DEFAULT_AUTHENTICATED_PATH, SIGN_IN_PATH, getSafeReturnTo } from '$lib/auth-routing';
import { api } from '$convex/_generated/api';

const fetchCurrentUser = async () => {
	const client = createConvexHttpClient();

	return await client.query(api.auth.getCurrentUser, {});
};

/** Resolves the signed-in user, or `null` when there is no session. */
export const getOptionalUser = fetchCurrentUser;

export const requireUser = async () => {
	const event = getRequestEvent();
	const user = await fetchCurrentUser();

	if (!user) {
		const returnTo = getSafeReturnTo(`${event.url.pathname}${event.url.search}`);
		const params = new URLSearchParams();

		if (returnTo) {
			params.set('returnTo', returnTo);
		}

		const destination = params.size > 0 ? `${SIGN_IN_PATH}?${params}` : SIGN_IN_PATH;

		redirect(303, destination);
	}

	return user;
};

export const redirectAuthenticatedUser = async (fallback = DEFAULT_AUTHENTICATED_PATH) => {
	const event = getRequestEvent();
	const user = await fetchCurrentUser();

	if (!user) {
		return null;
	}

	const returnTo = getSafeReturnTo(event.url.searchParams.get('returnTo'));

	redirect(303, returnTo ?? fallback);
};

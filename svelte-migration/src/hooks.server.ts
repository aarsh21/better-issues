import type { Handle } from '@sveltejs/kit';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { withServerConvexToken } from '@mmailaender/convex-svelte/sveltekit/server';

import { createAuth } from '$convex/auth.js';

export const handle: Handle = async ({ event, resolve }) => {
	const token = await getToken(createAuth, event.cookies);

	event.locals.token = token;

	return withServerConvexToken(token, () => resolve(event));
};

import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { withServerConvexToken } from '@mmailaender/convex-svelte/sveltekit/server';

import { createAuth } from '$convex/auth.js';

/**
 * Wrap createAuth so that process.env has BETTER_AUTH_URL / SITE_URL
 * before betterAuth() reads them.  Vite loads .env.local lazily, so
 * process.env is still empty at module-evaluation time; SvelteKit's
 * $env modules are the canonical source during SSR.
 */
const createAuthWithEnv: typeof createAuth = (ctx) => {
	process.env.BETTER_AUTH_URL ??= env.BETTER_AUTH_URL ?? publicEnv.PUBLIC_SITE_URL;
	process.env.SITE_URL ??= env.SITE_URL ?? publicEnv.PUBLIC_SITE_URL;
	return createAuth(ctx);
};

export const handle: Handle = async ({ event, resolve }) => {
	if (env.E2E_MOCK_AUTH === 'true') {
		event.locals.token = undefined;
		return resolve(event);
	}

	const token = await getToken(createAuthWithEnv, event.cookies);

	event.locals.token = token;

	return withServerConvexToken(token, () => resolve(event));
};

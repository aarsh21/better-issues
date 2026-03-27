import { env } from '$env/dynamic/public';

export const publicEnv = {
	allowSignups: env.PUBLIC_ALLOWED_SIGNUPS !== 'false',
	siteUrl: env.PUBLIC_SITE_URL,
	convexUrl: env.PUBLIC_CONVEX_URL,
	convexSiteUrl: env.PUBLIC_CONVEX_SITE_URL
};

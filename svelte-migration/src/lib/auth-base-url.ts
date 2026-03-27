import { publicEnv } from './public-env';

export const normalizeBaseUrl = (value: string | undefined) =>
	value?.trim().replace(/\/+$/, '') || undefined;

export const authBaseUrl = normalizeBaseUrl(publicEnv.siteUrl);

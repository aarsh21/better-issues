import type { RequestHandler } from './$types';

import { publicEnv } from '$lib/public-env';
import { buildAuthProxyUrl, createAuthProxyHeaders } from '$lib/server/auth-proxy';

const proxyAuthRequest: RequestHandler = async (event) => {
	const targetUrl = buildAuthProxyUrl(
		publicEnv.convexSiteUrl,
		event.url.pathname,
		event.url.search
	);
	const headers = createAuthProxyHeaders(
		event.request.headers,
		event.getClientAddress(),
		event.url
	);
	const body =
		event.request.method === 'GET' || event.request.method === 'HEAD'
			? undefined
			: await event.request.arrayBuffer();
	const response = await fetch(targetUrl, {
		method: event.request.method,
		headers,
		body,
		redirect: 'manual'
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
};

export const GET = proxyAuthRequest;
export const POST = proxyAuthRequest;

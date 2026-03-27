const normalizeUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, '') || undefined;

export const buildAuthProxyUrl = (
	convexSiteUrl: string | undefined,
	pathname: string,
	search: string
) => {
	const normalizedSiteUrl = normalizeUrl(convexSiteUrl);

	if (!normalizedSiteUrl) {
		throw new Error('PUBLIC_CONVEX_SITE_URL must be configured to proxy Better Auth requests.');
	}

	return new URL(`${pathname}${search}`, normalizedSiteUrl);
};

export const getForwardedForValue = (existingValue: string | null, clientAddress: string) => {
	const normalizedExistingValue = existingValue?.trim();

	return normalizedExistingValue ? `${normalizedExistingValue}, ${clientAddress}` : clientAddress;
};

export const createAuthProxyHeaders = (
	requestHeaders: Headers,
	clientAddress: string,
	origin: URL
) => {
	const headers = new Headers(requestHeaders);

	headers.delete('host');
	headers.set(
		'x-forwarded-for',
		getForwardedForValue(headers.get('x-forwarded-for'), clientAddress)
	);
	headers.set('x-real-ip', clientAddress);
	headers.set('x-forwarded-host', origin.host);
	headers.set('x-forwarded-proto', origin.protocol.replace(':', ''));

	return headers;
};

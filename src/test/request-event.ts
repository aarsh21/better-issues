type EventOverrides = Partial<{
	getClientAddress: () => string;
	locals: Record<string, unknown>;
	params: Record<string, string>;
	route: { id: string | null };
}>;

export const createRequestEvent = (
	input: string | URL,
	init?: RequestInit,
	overrides: EventOverrides = {}
) => {
	const url = input instanceof URL ? input : new URL(input);

	return {
		cookies: {} as never,
		fetch,
		getClientAddress: overrides.getClientAddress ?? (() => '127.0.0.1'),
		isDataRequest: false,
		locals: overrides.locals ?? {},
		params: overrides.params ?? {},
		platform: undefined,
		request: new Request(url, init),
		route: overrides.route ?? { id: url.pathname },
		setHeaders: () => undefined,
		url
	};
};

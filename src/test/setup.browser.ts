const processLike = ((globalThis as { process?: { env?: Record<string, string> } }).process ??= {
	env: {}
});

processLike.env ??= {};
processLike.env.TEST = 'true';

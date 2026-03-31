import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
	process.env.TEST = 'true';
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

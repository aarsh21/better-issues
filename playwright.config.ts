import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: 'http://127.0.0.1:4173'
	},
	webServer: {
		command: 'bun run build && bun run preview:test',
		env: {
			...process.env,
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'test-secret',
			E2E_MOCK_AUTH: 'true',
			PROFILE_IMAGE_SIGNING_SECRET:
				process.env.PROFILE_IMAGE_SIGNING_SECRET ?? process.env.BETTER_AUTH_SECRET ?? 'test-secret'
		},
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});

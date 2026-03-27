import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: {
		baseURL: 'http://127.0.0.1:4173'
	},
	webServer: [
		{
			command:
				'bash -lc "set -a && source .env.local && source .env.test && set +a && bunx convex dev --typecheck disable --tail-logs disable"',
			port: 3210,
			reuseExistingServer: !process.env.CI,
			timeout: 120000
		},
		{
			command:
				'bash -lc "set -a && source .env.local && source .env.test && set +a && npm run build && npm run preview -- --host 127.0.0.1 --port 4173"',
			port: 4173,
			reuseExistingServer: !process.env.CI,
			timeout: 120000
		}
	],
	testMatch: '**/*.e2e.{ts,js}'
});

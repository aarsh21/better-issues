import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		expect: {
			requireAssertions: true
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: [
				'src/convex/auth.ts',
				'src/convex/files.ts',
				'src/convex/http.ts',
				'src/convex/issues.ts',
				'src/convex/labels.ts',
				'src/convex/templates.ts',
				'src/convex/lib/**/*.ts',
				'src/lib/auth-base-url.ts',
				'src/lib/auth-routing.ts',
				'src/lib/issue-snapshot-cache.ts',
				'src/lib/organization.ts',
				'src/lib/public-env.ts',
				'src/lib/server/**/*.ts',
				'src/lib/shortcut-settings.ts',
				'src/lib/template-presets.ts',
				'src/lib/components/issues/filter-bar.svelte',
				'src/lib/components/issues/issue-list-body.svelte',
				'src/lib/components/issues/issue-row.svelte',
				'src/lib/components/issues/label-badge.svelte',
				'src/lib/components/issues/priority-indicator.svelte',
				'src/lib/components/issues/status-badge.svelte',
				'src/routes/+layout.server.ts',
				'src/routes/+page.server.ts',
				'src/routes/+page.svelte',
				'src/routes/api/**/+server.ts',
				'src/routes/invite/[id]/+page.server.ts',
				'src/routes/invite/[id]/+page.svelte',
				'src/routes/org/+page.server.ts',
				'src/routes/org/+page.svelte',
				'src/routes/org/[slug]/+layout.server.ts',
				'src/routes/sign-in/+page.server.ts',
				'src/routes/sign-in/+page.svelte',
				'src/routes/sign-up/+page.server.ts',
				'src/routes/sign-up/+page.svelte'
			],
			exclude: [
				'src/**/*.spec.ts',
				'src/**/*.test.ts',
				'src/convex/auth.config.ts',
				'src/convex/_generated/**',
				'src/convex/betterAuth/**',
				'src/convex/convex.config.ts',
				'src/convex/schema.ts',
				'src/convex/test.ts',
				'src/lib/test/**',
				'src/test/**'
			],
			thresholds: {
				lines: 80,
				functions: 80,
				statements: 80,
				branches: 70,
				'src/lib/server/**/*.ts': {
					lines: 90,
					functions: 80,
					statements: 90,
					branches: 80
				},
				'src/routes/**/+server.ts': {
					lines: 90,
					functions: 80,
					statements: 90,
					branches: 80
				},
				'src/routes/**/+page.server.ts': {
					lines: 90,
					functions: 80,
					statements: 90,
					branches: 80
				},
				'src/routes/**/+layout.server.ts': {
					lines: 90,
					functions: 80,
					statements: 90,
					branches: 80
				},
				'src/convex/**/*.ts': {
					lines: 85,
					functions: 80,
					statements: 80,
					branches: 75
				}
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'browser',
					setupFiles: ['./src/test/setup.browser.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					coverage: {
						thresholds: {
							lines: 80,
							functions: 80,
							statements: 80,
							branches: 70
						}
					}
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					setupFiles: ['./src/test/setup.server.ts'],
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/convex/**/*.spec.ts'],
					coverage: {
						thresholds: {
							lines: 90,
							functions: 80,
							statements: 90,
							branches: 80
						},
						include: [
							'src/routes/**/+server.ts',
							'src/routes/**/+page.server.ts',
							'src/routes/**/+layout.server.ts',
							'src/lib/server/**/*.ts'
						]
					}
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'convex',
					environment: 'edge-runtime',
					testTimeout: 20_000,
					setupFiles: ['./src/test/setup.convex.ts'],
					include: ['src/convex/**/*.spec.ts'],
					coverage: {
						thresholds: {
							lines: 85,
							functions: 80,
							statements: 80,
							branches: 75
						},
						include: [
							'src/convex/auth.ts',
							'src/convex/files.ts',
							'src/convex/http.ts',
							'src/convex/issues.ts',
							'src/convex/labels.ts',
							'src/convex/templates.ts',
							'src/convex/lib/**/*.ts'
						],
						exclude: [
							'src/convex/_generated/**',
							'src/convex/auth.config.ts',
							'src/convex/betterAuth/**',
							'src/convex/convex.config.ts',
							'src/convex/schema.ts',
							'src/convex/test.ts'
						]
					}
				}
			}
		]
	}
});

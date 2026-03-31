# better-issues

`better-issues` is a SvelteKit issue tracker with a Convex backend.

## Commands

Use `bun` for scripts and `bunx` for one-off tooling.

```sh
bun install
bun run check
bun run lint
bun run test
bun run test:coverage
bun run test:e2e
bun run build
```

Do not run `bun run dev` through the agent. Start it manually when you need a local app server.

## Testing Strategy

The repo uses three Vitest projects plus Playwright:

- `bun run test:browser` for Svelte component/browser specs
- `bun run test:server` for SvelteKit server loads, endpoints, and server utilities
- `bun run test:convex` for Convex-focused specs running on `edge-runtime`
- `bun run test:e2e` for Playwright smoke and critical-path coverage against preview mode

Coverage is collected with:

```sh
bun run test:coverage
```

## CI

GitHub Actions is the merge gate. The CI workflow installs dependencies with Bun and runs:

```sh
bun run check
bun run lint
bun run test:coverage
bun run build
bun run test:e2e
```

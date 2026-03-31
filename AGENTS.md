# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
It is Sveltekit app and a Convex backend.Treat every change as user-facing and keep design quality high.

**Non-Negotiables**

- Always use shadcn-svelte colors from @layout.css.
- ALWAYS USE shadcn-svelte components available components are: accordion,alert,alert-dialog,aspect-ratio,avatar,badge,breadcrumb,button,calendar,card,carousel,chart,checkbox,collapsible,command,context-menu,dialog,drawer,dropdown-menu,hover-card,input,input-otp,kbd,label,menubar,navigation-menu,pagination,popover,progress,radio-group,range-calendar,resizable,scroll-area,select,separator,sheet,sidebar,skeleton,slider,sonner,switch,table,tabs,textarea,toggle,toggle-group,tooltip
- Never run `bun run dev`; the user will run it manually.
- Keep the UX clean, fast.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

**Code Style and Conventions**

- TypeScript strict; avoid `any`, handle `undefined` from `noUncheckedIndexedAccess`.
- Type-only imports first; then external, `@/`, relative. One blank line between groups.
- Use double quotes, semicolons, 2-space indentation, trailing commas in multiline literals.
- Prefer `const`, `readonly` props, and named exports.

## Testing

- Use `bun run`, never `npm` or `npx`, for repo test commands.
- Main test commands:
  - `bun run test:browser`
  - `bun run test:server`
  - `bun run test:convex`
  - `bun run test:coverage`
  - `bun run test:e2e`
  - `bun run ci:test`
- Vitest is split into `browser`, `server`, and `convex` projects in `vitest.config.ts`. Keep new tests in the matching layer instead of collapsing everything into one project.
- Playwright E2E runs against preview mode, not `bun run dev`.
- Public-page E2E must remain hermetic: it should not require `bunx convex dev` or a live local Convex deployment to pass.
- Do not place `convex-test` helpers or other Node-only test utilities inside `src/convex/**`; Convex bundles that directory for runtime code. Keep those helpers under `src/test/**`.
- When changing server auth/bootstrap behavior, preserve the E2E mock mode used by Playwright in `playwright.config.ts`, `src/hooks.server.ts`, and `src/lib/server/auth.ts`.

**btca Research Tool**

Use `btca` for detailed research on project dependencies. Resources are configured in `btca.config.jsonc`.

Example usage:

```bash
# Ask about a specific resource
btca ask -r svele -q "how does reactivity work in svelte ?"

# Ask about multiple resources
btca ask -r svelte -r sveltekit -q "how does layouting system work in Sveltekit"

# Ask about a library not in config (one-off)
btca ask -r npm:react@19.2.3 -q "How does useTransition work?"
```

See all resources: `btca resources`
Add new resources: `btca add <url> -n <name> -t <type>`

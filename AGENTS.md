# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
It is a Turbo monorepo with a single Next.js app and a Convex backend.
Treat every change as user-facing and keep design quality high.

**Project Structure**

- `apps/web/` — Next.js app
- `apps/web/src/` — App Router pages, components, hooks, lib, styles
- `apps/web/public/` — Static assets
- `apps/web/next.config.ts` — Next.js config (standalone output, typed routes, React Compiler)
- `packages/backend/convex/` — Convex backend (schema, functions, auth, http)
- `packages/env/` — Shared env schema

**Non-Negotiables**

- Always use shadcn colors and shadcn/ui components for UI work.
- Never run `bun run dev`; the user will run it manually.
- Do not edit generated Convex files in `packages/backend/convex/_generated` or `packages/backend/convex/betterAuth/_generated`.
- Keep the UX clean, fast, and consistent with existing patterns.

**Core Commands**

- Install deps: `bun install`
- Convex setup: `bun run dev:setup`
- Lint + format: `bun run check`
- Type check: `bun run check-types`
- Build: `bun run build`
- Dev servers (only if asked): `bun run dev:web`, `bun run dev:server`

**Tests**

- No test runner is configured; single-test command not available.

**Code Style and Conventions**

- TypeScript strict; avoid `any`, handle `undefined` from `noUncheckedIndexedAccess`.
- Type-only imports first; then external, `@/`, relative. One blank line between groups.
- Use double quotes, semicolons, 2-space indentation, trailing commas in multiline literals.
- Prefer `const`, `readonly` props, and named exports.

**React and Next.js**

- App Router; default to Server Components. Add `"use client"` only when required.
- Respect typed routes in `next.config.ts`. Keep layouts/pages small.

**Convex Backend**

- Use `query`, `mutation`, `action` from `packages/backend/convex/_generated/server`.
- Validate args with `v`; return serializable data; prefer `ConvexError` for user-facing errors.

**Styling and UI**

- Use shadcn tokens from `apps/web/src/index.css` and shadcn/ui primitives.
- Use `cn` from `apps/web/src/lib/utils.ts`; follow CVA patterns; keep `rounded-none`.

**Naming and Errors**

- Components: PascalCase; hooks: `useX`; files: kebab-case; constants: `SCREAMING_SNAKE`.
- Catch/convert errors at backend boundaries; avoid swallowing errors.

**Cursor/Copilot Rules**

- No Cursor or Copilot rules found in `.cursor/rules/`, `.cursorrules`,
  or `.github/copilot-instructions.md`.

**Agent Skills Available in This Repo**

- better-auth-best-practices
- frontend-design
- next-best-practices
- ui-ux-pro-max
- vercel-react-best-practices
- web-design-guidelines
- avoid-feature-creep
- convex
- convex-agents
- convex-best-practices
- convex-component-authoring
- convex-cron-jobs
- convex-file-storage
- convex-functions
- convex-http-actions
- convex-migrations
- convex-realtime
- convex-schema-validator
- convex-security-audit
- convex-security-check

**btca Research Tool**

Use `btca` for detailed research on project dependencies. Resources are configured in `btca.config.jsonc`.

Configured resources:

- `tanstack-start` — TanStack Start framework
- `tanstack-router` — Type-safe React routing
- `convex` — Backend platform
- `tanstack-query` — Server state management
- `tanstack-form` — Form state management
- `better-auth` — Authentication framework
- `tailwindcss` — CSS framework
- `shadcn-ui` — UI component library
- `turborepo` — Monorepo build system
- `vite` — Build tool

Example usage:

```bash
# Ask about a specific resource
btca ask -r tanstack-start -q "How do I create a server function?"

# Ask about multiple resources
btca ask -r tanstack-router -r tanstack-query -q "Best practices for data loading?"

# Ask about a library not in config (one-off)
btca ask -r npm:react@19.2.3 -q "How does useTransition work?"
```

See all resources: `btca resources`
Add new resources: `btca add <url> -n <name> -t <type>`

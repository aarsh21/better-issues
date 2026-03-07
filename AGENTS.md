# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
It is a Turbo monorepo with a single TanStack Start app and a Convex backend.
Treat every change as user-facing and keep design quality high.

**Project Structure**

- `apps/web/` — TanStack Start app
- `apps/web/src/` — TanStack Router route modules (`app/`), components, hooks, lib, styles
- `apps/web/public/` — Static assets
- `apps/web/vite.config.ts` — Vite and TanStack Start config
- `apps/api/` — Elysia API server
- `packages/db/` — Drizzle schema, migrations, and database client
- `packages/auth/` — Better Auth config and permission helpers
- `packages/api-client/` — Eden client, shared DTOs, and query helpers
- `packages/env/` — Shared env schema

**Non-Negotiables**

- ALWAYS USE BUN.
- Always use shadcn colors and shadcn/ui components for UI work.
- Never run `bun run dev`; the user will run it manually.
- Keep the UX clean, fast, and consistent with existing patterns.

**Core Commands**

- Install deps: `bun install`
- Lint + format: `bun run check`
- Type check: `bun run check-types`
- Build: `bun run build`
- Dev servers (only if asked): `bun run dev:web`, `bun run dev:api`
- Database: `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`, `bun run db:seed`

**Tests**

- No test runner is configured; single-test command not available.

**Code Style and Conventions**

- TypeScript strict; avoid `any`, handle `undefined` from `noUncheckedIndexedAccess`.
- Type-only imports first; then external, `@/`, relative. One blank line between groups.
- Use double quotes, semicolons, 2-space indentation, trailing commas in multiline literals.
- Prefer `const`, `readonly` props, and named exports.

**React and TanStack Start**

- TanStack Router file-based routes live in `apps/web/src/app/`; keep route modules small and focused.
- Respect generated route artifacts like `apps/web/src/routeTree.gen.ts`; do not hand-edit generated files.

**API + Data**

- Keep Better Auth as the source of truth for users, sessions, organizations, members, and invitations.
- Keep Drizzle schema and database access inside `packages/db`.
- Keep Elysia routes and UploadThing handlers inside `apps/api/src/`.

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
- tanstack-start-best-practices
- tanstack-router-best-practices
- tanstack-query-best-practices
- ui-ux-pro-max
- vercel-react-best-practices
- web-design-guidelines
- avoid-feature-creep

**btca Research Tool**

Use `btca` for detailed research on project dependencies. Resources are configured in `btca.config.jsonc`.

Configured resources:

- `tanstack-start` — TanStack Start framework
- `tanstack-router` — Type-safe React routing
- `elysia-docs` — Elysia server framework
- `drizzle-orm-docs` — Drizzle ORM
- `uploadthing` — File uploads
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
Available resources: better-auth, elysia-docs, router, tanstack-query, tanstack-start, shadcn, drizzle-orm-docs, uploadthing

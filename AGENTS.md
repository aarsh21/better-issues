# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
Treat every change as user-facing and keep design quality high.

**Non-Negotiables**

- Always use shadcn colors and shadcn/ui components for UI work.
- Never run `bun run dev`; the user will run it manually.
- Do not edit generated Convex files in `packages/backend/convex/_generated`.
- Keep the UX clean, fast, and consistent with existing patterns.

**Core Commands**

- Install deps: `bun install`
- Convex setup: `bun run dev:setup`
- Lint + format: `bun run check`
- Type check: `bun run check-types`
- Build all: `bun run build`
- Build web only: `bun run --filter web build`
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
- Respect typed routes in `apps/web/next.config.ts`. Keep layouts/pages small.

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

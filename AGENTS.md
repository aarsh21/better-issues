# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
It is a single Next.js app with a Convex backend (not a monorepo).
Treat every change as user-facing and keep design quality high.

**Project Structure**

- `src/` — Next.js app (pages, components, hooks, lib, styles)
- `convex/` — Convex backend (schema, functions, auth, http)
- `public/` — Static assets
- `next.config.ts` — Next.js config (standalone output, typed routes, React Compiler)

**Non-Negotiables**

- Always use shadcn colors and shadcn/ui components for UI work.
- Never run `bun run dev`; the user will run it manually.
- Do not edit generated Convex files in `convex/_generated`.
- Keep the UX clean, fast, and consistent with existing patterns.

**Core Commands**

- Install deps: `bun install`
- Convex setup: `bun run dev:setup`
- Lint + format: `bun run check`
- Type check: `bun run check-types`
- Build: `bun run build`
- Dev servers (only if asked): `bun run dev`, `bun run dev:server`

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

- Use `query`, `mutation`, `action` from `convex/_generated/server`.
- Validate args with `v`; return serializable data; prefer `ConvexError` for user-facing errors.

**Styling and UI**

- Use shadcn tokens from `src/index.css` and shadcn/ui primitives.
- Use `cn` from `src/lib/utils.ts`; follow CVA patterns; keep `rounded-none`.

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

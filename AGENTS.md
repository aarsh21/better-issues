# AGENTS

better-issues is a premium issue tracker with best-in-market UI and UX.
It is Sveltekit app and a Convex backend.
Treat every change as user-facing and keep design quality high.

**Non-Negotiables**

- Always use shadcn-svelte colors from @layout.css and shadcn-svelte/ui components for UI work.
- Never run `bun run dev`; the user will run it manually.
- Keep the UX clean, fast, and consistent with existing patterns.

**Code Style and Conventions**

- TypeScript strict; avoid `any`, handle `undefined` from `noUncheckedIndexedAccess`.
- Type-only imports first; then external, `@/`, relative. One blank line between groups.
- Use double quotes, semicolons, 2-space indentation, trailing commas in multiline literals.
- Prefer `const`, `readonly` props, and named exports.

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
btca ask -r svele -q "how does reactivity work in svelte ?"

# Ask about multiple resources
btca ask -r svelte -r sveltekit -q "how does layouting system work in Sveltekit"

# Ask about a library not in config (one-off)
btca ask -r npm:react@19.2.3 -q "How does useTransition work?"
```

See all resources: `btca resources`
Add new resources: `btca add <url> -n <name> -t <type>`

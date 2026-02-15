import { createFileRoute } from "@tanstack/react-router";

/**
 * Debug route: returns 200 if /api/auth/* reaches this app.
 * If this 404s, the reverse proxy is routing /api/auth elsewhere.
 */
export const Route = createFileRoute("/api/auth/ready")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ ok: true, message: "auth route reachable" }, { status: 200 }),
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

import { env } from "@better-issues/env/web";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(`${env.API_URL}/api/health`);
        return new Response(await response.text(), {
          status: response.status,
          headers: response.headers,
        });
      },
    },
  },
});

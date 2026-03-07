import { createFileRoute } from "@tanstack/react-router";

import { env } from "@better-issues/env/web";

const forwardRequest = async (request: Request) => {
  const targetUrl = new URL(request.url);
  targetUrl.host = new URL(env.API_URL).host;
  targetUrl.protocol = new URL(env.API_URL).protocol;

  return await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
  });
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => forwardRequest(request),
      POST: ({ request }) => forwardRequest(request),
    },
  },
});

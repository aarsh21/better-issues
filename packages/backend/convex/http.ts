import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { createAuth } from "./betterAuth/auth";

const http = httpRouter();

const AUTH_BASE_PATH = "/api/auth";
const OIDC_WELL_KNOWN_PATH = "/.well-known/openid-configuration";
const OIDC_INTERNAL_PATH = `${AUTH_BASE_PATH}/convex${OIDC_WELL_KNOWN_PATH}`;

const authRequestHandler = httpAction(async (ctx, request) => {
  const auth = createAuth(ctx);
  return auth.handler(request);
});

// Expose OIDC well-known at the root path expected by Convex auth config checks.
http.route({
  path: OIDC_WELL_KNOWN_PATH,
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    url.pathname = OIDC_INTERNAL_PATH;
    const auth = createAuth(ctx);
    return auth.handler(new Request(url, request));
  }),
});

http.route({
  pathPrefix: `${AUTH_BASE_PATH}/`,
  method: "GET",
  handler: authRequestHandler,
});

http.route({
  pathPrefix: `${AUTH_BASE_PATH}/`,
  method: "POST",
  handler: authRequestHandler,
});

export default http;

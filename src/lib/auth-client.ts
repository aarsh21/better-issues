import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { organizationClient, usernameClient } from "better-auth/client/plugins";

import { authBaseUrl } from "./auth-base-url";
import { ac, admin, member, owner } from "./permissions";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [
    convexClient(),
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    usernameClient(),
  ],
});

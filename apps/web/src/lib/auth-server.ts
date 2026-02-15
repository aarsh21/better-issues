import { env } from "@better-issues/env/web";
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
    convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL ?? env.NEXT_PUBLIC_CONVEX_URL,
  });

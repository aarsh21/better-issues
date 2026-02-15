import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.url(),
  NEXT_PUBLIC_CONVEX_SITE_URL: z.url(),
});

const viteEnv: Record<string, string | undefined> =
  (typeof import.meta !== "undefined"
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : undefined) ?? {};

export const env = envSchema.parse({
  NEXT_PUBLIC_CONVEX_URL: viteEnv.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CONVEX_SITE_URL:
    viteEnv.NEXT_PUBLIC_CONVEX_SITE_URL ??
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
    viteEnv.NEXT_PUBLIC_CONVEX_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL,
});

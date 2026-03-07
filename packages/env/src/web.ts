import { z } from "zod";

const envSchema = z.object({
  API_URL: z.url().optional(),
  VITE_API_URL: z.url().optional(),
  ALLOWED_SIGNUPS: z.enum(["true", "false"]).optional(),
  VITE_ALLOWED_SIGNUPS: z.enum(["true", "false"]).optional(),
});

const viteEnv: Record<string, string | undefined> =
  (typeof import.meta !== "undefined"
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : undefined) ?? {};

const parsed = envSchema.parse({
  API_URL: process.env.API_URL,
  VITE_API_URL: viteEnv.VITE_API_URL ?? process.env.VITE_API_URL,
  ALLOWED_SIGNUPS: process.env.ALLOWED_SIGNUPS,
  VITE_ALLOWED_SIGNUPS: viteEnv.VITE_ALLOWED_SIGNUPS ?? process.env.VITE_ALLOWED_SIGNUPS,
});

export const env = {
  API_URL: parsed.VITE_API_URL ?? parsed.API_URL ?? "http://localhost:3002",
  ALLOWED_SIGNUPS: parsed.VITE_ALLOWED_SIGNUPS ?? parsed.ALLOWED_SIGNUPS ?? "true",
} as const;

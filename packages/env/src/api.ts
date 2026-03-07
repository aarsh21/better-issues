import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.url(),
  API_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  UPLOADTHING_TOKEN: z.string().min(1),
  ALLOWED_SIGNUPS: z.enum(["true", "false"]).optional(),
});

export const env = envSchema.parse({
  APP_URL: process.env.APP_URL,
  API_URL: process.env.API_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
  ALLOWED_SIGNUPS: process.env.ALLOWED_SIGNUPS,
});

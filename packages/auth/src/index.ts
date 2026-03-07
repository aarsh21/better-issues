import { and, eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins/organization";
import { username } from "better-auth/plugins/username";

import {
  db,
  labels,
  members,
  organizationSettings,
  organizations,
  schema,
  users,
} from "@better-issues/db";
import { DEFAULT_LABELS } from "@better-issues/db/default-labels";
import { env } from "@better-issues/env/api";

import { ac, admin, member, owner } from "./permissions";

const signupsEnabled = env.ALLOWED_SIGNUPS !== "false";

const now = () => Date.now();

export const auth = betterAuth({
  appName: "better-issues",
  baseURL: env.API_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_URL, env.API_URL],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !signupsEnabled,
    requireEmailVerification: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const body = ctx.body as Record<string, unknown> | undefined;
      const usernameValue = body?.username;

      if (typeof usernameValue !== "string" || usernameValue.trim().length === 0) {
        throw new APIError("BAD_REQUEST", {
          message: "Username is required",
        });
      }
    }),
  },
  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },
      allowUserToCreateOrganization: true,
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          const timestamp = now();

          await db.insert(organizationSettings).values({
            organizationId: organization.id,
            nextIssueNumber: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          });

          const existingLabels = await db
            .select()
            .from(labels)
            .where(eq(labels.organizationId, organization.id));
          const existingNames = new Set(existingLabels.map((label) => label.normalizedName));

          for (const label of DEFAULT_LABELS) {
            const normalizedName = label.name.toLowerCase();
            if (existingNames.has(normalizedName)) {
              continue;
            }

            await db.insert(labels).values({
              id: crypto.randomUUID(),
              organizationId: organization.id,
              name: label.name,
              normalizedName,
              color: label.color,
              description: label.description ?? null,
              createdAt: timestamp,
            });
          }
        },
      },
    }),
    username(),
  ],
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;

export async function getSessionFromHeaders(headers: Headers) {
  return await auth.api.getSession({
    headers,
  });
}

export async function getUserById(userId: string) {
  return (await db.select().from(users).where(eq(users.id, userId)).get()) ?? null;
}

export async function getOrganizationById(organizationId: string) {
  return (
    (await db.select().from(organizations).where(eq(organizations.id, organizationId)).get()) ??
    null
  );
}

export async function getActiveOrganizationForUser(
  userId: string,
  activeOrganizationId?: string | null,
) {
  if (activeOrganizationId) {
    const organizationRecord = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, activeOrganizationId))
      .get();
    if (organizationRecord) {
      return organizationRecord;
    }
  }

  const membership = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logo: organizations.logo,
      metadata: organizations.metadata,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .innerJoin(members, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, userId))
    .get();

  return membership ?? null;
}

export async function updateUserProfile(
  userId: string,
  values: {
    name?: string;
    username?: string | null;
    image?: string | null;
  },
) {
  if (values.username !== undefined && values.username !== null) {
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.username, values.username), eq(users.id, userId)))
      .get();

    if (!existing) {
      const conflicting = await db
        .select()
        .from(users)
        .where(eq(users.username, values.username))
        .get();

      if (conflicting) {
        throw new APIError("BAD_REQUEST", {
          message: "Username is already taken",
        });
      }
    }
  }

  await db
    .update(users)
    .set({
      name: values.name,
      username: values.username ?? null,
      image: values.image ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return await getUserById(userId);
}

export * from "./permissions";

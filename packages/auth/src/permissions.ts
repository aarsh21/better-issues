import { and, eq } from "drizzle-orm";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

import { db, members } from "@better-issues/db";

const statement = {
  ...defaultStatements,
  issue: ["create", "update", "delete", "close"],
  label: ["create", "update", "delete"],
  template: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const member = ac.newRole({
  ...memberAc.statements,
  issue: ["create", "update"],
  label: [],
  template: [],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  issue: ["create", "update", "delete", "close"],
  label: ["create", "update", "delete"],
  template: ["create", "update", "delete"],
});

export const owner = ac.newRole({
  ...ownerAc.statements,
  issue: ["create", "update", "delete", "close"],
  label: ["create", "update", "delete"],
  template: ["create", "update", "delete"],
});

const rolePermissions: Record<string, Record<string, readonly string[]>> = {
  owner: {
    issue: ["create", "update", "delete", "close"],
    label: ["create", "update", "delete"],
    template: ["create", "update", "delete"],
  },
  admin: {
    issue: ["create", "update", "delete", "close"],
    label: ["create", "update", "delete"],
    template: ["create", "update", "delete"],
  },
  member: {
    issue: ["create", "update"],
    label: [],
    template: [],
  },
};

type Resource = "issue" | "label" | "template";
type ActionMap = {
  issue: "create" | "update" | "delete" | "close";
  label: "create" | "update" | "delete";
  template: "create" | "update" | "delete";
};

export type OrgMember = typeof members.$inferSelect;

export async function getOrgMember(
  userId: string,
  organizationId: string,
): Promise<OrgMember | null> {
  return (
    (await db
      .select()
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.organizationId, organizationId)))
      .get()) ?? null
  );
}

export async function requireOrgMembership(
  userId: string,
  organizationId: string,
): Promise<OrgMember> {
  const orgMember = await getOrgMember(userId, organizationId);
  if (!orgMember) {
    throw new Error("Not a member of this organization");
  }

  return orgMember;
}

export async function requirePermission<R extends Resource>(
  userId: string,
  organizationId: string,
  resource: R,
  action: ActionMap[R],
): Promise<OrgMember> {
  const orgMember = await requireOrgMembership(userId, organizationId);
  const allowed = rolePermissions[orgMember.role]?.[resource];

  if (!allowed || !allowed.includes(action)) {
    throw new Error(
      `Insufficient permissions: role "${orgMember.role}" cannot ${action} ${resource}`,
    );
  }

  return orgMember;
}

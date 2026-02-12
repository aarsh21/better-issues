import type { GenericQueryCtx } from "convex/server";

import { ConvexError } from "convex/values";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

import type { DataModel } from "../_generated/dataModel";
import { components } from "../_generated/api";

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

/**
 * Role-to-permission mapping for custom resources.
 * Maps each role to which actions are allowed on each resource.
 */
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
type IssueAction = "create" | "update" | "delete" | "close";
type LabelAction = "create" | "update" | "delete";
type TemplateAction = "create" | "update" | "delete";
type Action<R extends Resource> = R extends "issue"
  ? IssueAction
  : R extends "label"
    ? LabelAction
    : TemplateAction;

interface OrgMember {
  readonly _id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: string;
  readonly createdAt: number;
}

/**
 * Look up the authenticated user's membership in an organization via the
 * Better Auth component's `member` table.
 *
 * Returns the member record or `null` if the user is not a member.
 */
export async function getOrgMember(
  ctx: GenericQueryCtx<DataModel>,
  userId: string,
  organizationId: string,
): Promise<OrgMember | null> {
  const result = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "member",
    where: [
      { field: "userId", value: userId },
      { field: "organizationId", value: organizationId },
    ],
  })) as OrgMember | null;
  return result;
}

/**
 * Require the user to be a member of the organization **and** have a role
 * that grants the given action on the given resource.
 *
 * Throws `ConvexError` if the user is not a member or lacks permission.
 * Returns the member record on success.
 */
export async function requirePermission<R extends Resource>(
  ctx: GenericQueryCtx<DataModel>,
  userId: string,
  organizationId: string,
  resource: R,
  action: Action<R>,
): Promise<OrgMember> {
  const orgMember = await getOrgMember(ctx, userId, organizationId);
  if (!orgMember) {
    throw new ConvexError("Not a member of this organization");
  }

  const allowed = rolePermissions[orgMember.role]?.[resource];
  if (!allowed || !allowed.includes(action)) {
    throw new ConvexError(
      `Insufficient permissions: role "${orgMember.role}" cannot ${action} ${resource}`,
    );
  }

  return orgMember;
}

/**
 * Require the user to be a member of the organization (any role).
 *
 * Useful for read-only queries where any org member should have access.
 * Throws `ConvexError` if the user is not a member.
 */
export async function requireOrgMembership(
  ctx: GenericQueryCtx<DataModel>,
  userId: string,
  organizationId: string,
): Promise<OrgMember> {
  const orgMember = await getOrgMember(ctx, userId, organizationId);
  if (!orgMember) {
    throw new ConvexError("Not a member of this organization");
  }
  return orgMember;
}

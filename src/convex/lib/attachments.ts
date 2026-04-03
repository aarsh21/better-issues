import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

import { ConvexError } from "convex/values";

/**
 * Verify that every storageId in the set has been claimed for this organization.
 * Throws if any storageId is unclaimed.
 */
export async function requireClaimedAttachments(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  storageIds: Set<Id<"_storage">>,
): Promise<void> {
  if (storageIds.size === 0) return;

  const checks = Array.from(storageIds).map(async (storageId) => {
    const attachment = await ctx.db
      .query("attachments")
      .withIndex("by_org_and_storage", (q) =>
        q.eq("organizationId", organizationId).eq("storageId", storageId),
      )
      .unique();

    if (!attachment) {
      throw new ConvexError(
        `File ${storageId} has not been claimed for this organization`,
      );
    }
  });

  await Promise.all(checks);
}

/**
 * Delete attachment claim records for the given storageIds.
 * Best-effort: silently skips missing claims.
 */
export async function deleteAttachmentClaims(
  ctx: MutationCtx,
  organizationId: string,
  storageIds: Set<Id<"_storage">>,
): Promise<void> {
  if (storageIds.size === 0) return;

  const deletes = Array.from(storageIds).map(async (storageId) => {
    const attachment = await ctx.db
      .query("attachments")
      .withIndex("by_org_and_storage", (q) =>
        q.eq("organizationId", organizationId).eq("storageId", storageId),
      )
      .unique();

    if (attachment) {
      await ctx.db.delete(attachment._id);
    }
  });

  await Promise.all(deletes);
}

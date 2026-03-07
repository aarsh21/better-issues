import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { UTApi, createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

import { getSessionFromHeaders } from "@better-issues/auth";
import { db, attachments, issues, users } from "@better-issues/db";

const f = createUploadthing();

const issueAttachmentInputSchema = z.object({
  organizationId: z.string(),
  issueId: z.string().optional(),
});

export const uploadRouter = {
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1, acl: "public-read" } })
    .middleware(async ({ req }) => {
      const session = await getSessionFromHeaders(req.headers);
      if (!session) {
        throw new UploadThingError("You must be signed in");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      await db
        .update(users)
        .set({
          image: file.ufsUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, metadata.userId));

      return {
        imageUrl: file.ufsUrl,
      };
    }),
  issueAttachment: f(
    {
      image: { maxFileSize: "8MB", maxFileCount: 8, acl: "private" },
      pdf: { maxFileSize: "16MB", maxFileCount: 8, acl: "private" },
      text: { maxFileSize: "4MB", maxFileCount: 8, acl: "private" },
    },
    {
      awaitServerData: true,
    },
  )
    .input(issueAttachmentInputSchema)
    .middleware(async ({ req, input }) => {
      const session = await getSessionFromHeaders(req.headers);
      if (!session) {
        throw new UploadThingError("You must be signed in");
      }

      if (input.issueId) {
        const issue = await db
          .select()
          .from(issues)
          .where(and(eq(issues.id, input.issueId), eq(issues.organizationId, input.organizationId)))
          .get();

        if (!issue) {
          throw new UploadThingError("Issue not found");
        }
      }

      return {
        userId: session.user.id,
        organizationId: input.organizationId,
        issueId: input.issueId ?? null,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const attachmentId = crypto.randomUUID();

      await db.insert(attachments).values({
        id: attachmentId,
        organizationId: metadata.organizationId,
        issueId: metadata.issueId,
        uploadedByUserId: metadata.userId,
        providerKey: file.key,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        createdAt: Date.now(),
      });

      return {
        attachmentId,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const utapi = new UTApi();

export const uploadHandler = createRouteHandler({
  router: uploadRouter,
});

export async function deletePendingAttachment(attachmentId: string, userId: string) {
  const attachment = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.id, attachmentId),
        eq(attachments.uploadedByUserId, userId),
        isNull(attachments.issueId),
      ),
    )
    .get();

  if (!attachment) {
    return null;
  }

  await utapi.deleteFiles(attachment.providerKey);
  await db.delete(attachments).where(eq(attachments.id, attachmentId));
  return attachment;
}

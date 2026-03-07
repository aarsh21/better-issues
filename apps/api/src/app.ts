import { and, desc, eq, inArray, like, lt, or } from "drizzle-orm";
import { Elysia, t } from "elysia";

import {
  auth,
  getActiveOrganizationForUser,
  getSessionFromHeaders,
  requireOrgMembership,
  requirePermission,
  updateUserProfile,
} from "@better-issues/auth";
import { db } from "@better-issues/db";
import {
  attachments,
  issueLabels,
  issueTemplates,
  issues,
  labels,
  organizationSettings,
} from "@better-issues/db/schema";
import { parseTemplateSchema, validateTemplateData } from "@better-issues/api-client/contracts";
import { cors } from "@elysiajs/cors";
import { env } from "@better-issues/env/api";

import { HttpError } from "./errors";
import { uploadHandler, utapi } from "./uploadthing";

const PAGE_SIZE = 25;

const toLabelDto = (label: typeof labels.$inferSelect) => ({
  _id: label.id,
  _creationTime: label.createdAt,
  organizationId: label.organizationId,
  name: label.name,
  color: label.color,
  description: label.description,
});

const toTemplateDto = (template: typeof issueTemplates.$inferSelect) => ({
  _id: template.id,
  _creationTime: template.createdAt,
  organizationId: template.organizationId,
  name: template.name,
  description: template.description,
  schema: template.schema,
  createdBy: template.createdBy,
  createdAt: template.createdAt,
});

const toIssueDto = (issue: typeof issues.$inferSelect, labelIds: string[]) => ({
  _id: issue.id,
  _creationTime: issue.createdAt,
  organizationId: issue.organizationId,
  number: issue.number,
  title: issue.title,
  description: issue.description,
  status: issue.status as "open" | "in_progress" | "closed",
  priority: issue.priority as "low" | "medium" | "high" | "urgent",
  assigneeId: issue.assigneeId,
  labelIds,
  createdBy: issue.createdBy,
  templateId: issue.templateId,
  templateData: issue.templateData,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
  closedAt: issue.closedAt,
});

const toAttachmentDto = async (attachment: typeof attachments.$inferSelect) => ({
  _id: attachment.id,
  _creationTime: attachment.createdAt,
  organizationId: attachment.organizationId,
  issueId: attachment.issueId,
  uploadedByUserId: attachment.uploadedByUserId,
  providerKey: attachment.providerKey,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  sizeBytes: attachment.sizeBytes,
  url: (await utapi.generateSignedURL(attachment.providerKey)).ufsUrl,
});

const getIssueLabelMap = async (issueIds: string[]) => {
  if (issueIds.length === 0) {
    return new Map<string, string[]>();
  }

  const rows = await db.select().from(issueLabels).where(inArray(issueLabels.issueId, issueIds));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const current = map.get(row.issueId) ?? [];
    current.push(row.labelId);
    map.set(row.issueId, current);
  }

  return map;
};

const parseCursor = (cursor?: string | null) => {
  if (!cursor) {
    return null;
  }

  const number = Number.parseInt(cursor, 10);
  if (Number.isNaN(number)) {
    return null;
  }

  return number;
};

const buildIssueFilters = (params: {
  organizationId: string;
  status?: string;
  assigneeId?: string;
  q?: string;
  cursor?: string | null;
}) => {
  const filters = [eq(issues.organizationId, params.organizationId)];

  if (params.status) {
    filters.push(eq(issues.status, params.status));
  }

  if (params.assigneeId) {
    filters.push(eq(issues.assigneeId, params.assigneeId));
  }

  if (params.q && params.q.trim().length > 0) {
    const trimmed = params.q.trim();
    const asNumber = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(asNumber) && `${asNumber}` === trimmed) {
      filters.push(or(eq(issues.number, asNumber), like(issues.title, `%${trimmed}%`))!);
    } else {
      filters.push(like(issues.title, `%${trimmed}%`));
    }
  }

  const cursorNumber = parseCursor(params.cursor);
  if (cursorNumber !== null) {
    filters.push(lt(issues.number, cursorNumber));
  }

  return filters;
};

type AppSession = Awaited<ReturnType<typeof getSessionFromHeaders>>;

const ensure = <T>(value: T | null | undefined, status: number, message: string): T => {
  if (value === null || value === undefined) {
    throw new HttpError(status, message);
  }

  return value;
};

const requireSession = (session: AppSession): NonNullable<AppSession> => {
  return ensure(session, 401, "Not authenticated");
};

const invariant = (condition: boolean, status: number, message: string) => {
  if (!condition) {
    throw new HttpError(status, message);
  }
};

const app = new Elysia()
  .use(
    cors({
      origin: [env.APP_URL],
      credentials: true,
    }),
  )
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return {
        message: error.message,
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        message: error.message,
      };
    }

    set.status = 500;
    return {
      message: error instanceof Error ? error.message : "Internal server error",
    };
  })
  .derive(async ({ request }) => {
    const session = await getSessionFromHeaders(request.headers);
    return {
      authSession: session,
    };
  })
  .mount(auth.handler)
  .all("/api/uploadthing", ({ request }) => uploadHandler(request))
  .all("/api/uploadthing/*", ({ request }) => uploadHandler(request))
  .get("/api/health", () => ({
    status: "healthy",
    timestamp: Date.now(),
  }))
  .group("/api/v1", (api) =>
    api
      .get("/me", async ({ authSession }) => {
        const session = requireSession(authSession);
        const activeOrganization = await getActiveOrganizationForUser(
          session.user.id,
          session.session.activeOrganizationId,
        );

        return {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          username: session.user.username,
          image: session.user.image,
          activeOrganizationId:
            activeOrganization?.id ?? session.session.activeOrganizationId ?? null,
        };
      })
      .patch(
        "/me/profile",
        async ({ authSession, body }) => {
          const session = requireSession(authSession);
          const user = ensure(
            await updateUserProfile(session.user.id, {
              name: body.name,
              username: body.username,
              image: body.image,
            }),
            404,
            "User not found",
          );
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image,
            activeOrganizationId: session.session.activeOrganizationId ?? null,
          };
        },
        {
          body: t.Object({
            name: t.Optional(t.String()),
            username: t.Optional(t.Union([t.String(), t.Null()])),
            image: t.Optional(t.Union([t.String(), t.Null()])),
          }),
        },
      )
      .get(
        "/labels",
        async ({ authSession, query }) => {
          const session = requireSession(authSession);
          await requireOrgMembership(session.user.id, query.organizationId);

          const items = await db
            .select()
            .from(labels)
            .where(eq(labels.organizationId, query.organizationId))
            .orderBy(labels.name);

          return items.map(toLabelDto);
        },
        {
          query: t.Object({
            organizationId: t.String(),
          }),
        },
      )
      .post(
        "/labels",
        async ({ authSession, body }) => {
          const session = requireSession(authSession);
          await requirePermission(session.user.id, body.organizationId, "label", "create");

          const normalizedName = body.name.trim().toLowerCase();
          invariant(normalizedName.length > 0, 400, "Label name is required");

          const existing = await db
            .select()
            .from(labels)
            .where(
              and(
                eq(labels.organizationId, body.organizationId),
                eq(labels.normalizedName, normalizedName),
              ),
            )
            .get();

          invariant(!existing, 400, "A label with this name already exists");

          const label = {
            id: crypto.randomUUID(),
            organizationId: body.organizationId,
            name: body.name.trim(),
            normalizedName,
            color: body.color,
            description: body.description ?? null,
            createdAt: Date.now(),
          };
          await db.insert(labels).values(label);
          return toLabelDto(label);
        },
        {
          body: t.Object({
            organizationId: t.String(),
            name: t.String(),
            color: t.String(),
            description: t.Optional(t.Nullable(t.String())),
          }),
        },
      )
      .patch(
        "/labels/:labelId",
        async ({ authSession, params, body }) => {
          const session = requireSession(authSession);
          const label = ensure(
            await db.select().from(labels).where(eq(labels.id, params.labelId)).get(),
            404,
            "Label not found",
          );
          await requirePermission(session.user.id, label.organizationId, "label", "update");

          const nextName = body.name?.trim();
          if (nextName) {
            const normalizedName = nextName.toLowerCase();
            const existing = await db
              .select()
              .from(labels)
              .where(
                and(
                  eq(labels.organizationId, label.organizationId),
                  eq(labels.normalizedName, normalizedName),
                ),
              )
              .get();
            invariant(
              !existing || existing.id === label.id,
              400,
              "A label with this name already exists",
            );
          }

          await db
            .update(labels)
            .set({
              name: nextName ?? label.name,
              normalizedName: nextName ? nextName.toLowerCase() : label.normalizedName,
              color: body.color ?? label.color,
              description: body.description ?? label.description,
            })
            .where(eq(labels.id, label.id));

          const updated = ensure(
            await db.select().from(labels).where(eq(labels.id, label.id)).get(),
            404,
            "Label not found",
          );
          return toLabelDto(updated);
        },
        {
          params: t.Object({
            labelId: t.String(),
          }),
          body: t.Object({
            name: t.Optional(t.String()),
            color: t.Optional(t.String()),
            description: t.Optional(t.Nullable(t.String())),
          }),
        },
      )
      .delete(
        "/labels/:labelId",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const label = ensure(
            await db.select().from(labels).where(eq(labels.id, params.labelId)).get(),
            404,
            "Label not found",
          );
          await requirePermission(session.user.id, label.organizationId, "label", "delete");

          await db.delete(labels).where(eq(labels.id, label.id));
          return {
            ok: true,
          };
        },
        {
          params: t.Object({
            labelId: t.String(),
          }),
        },
      )
      .get(
        "/templates",
        async ({ authSession, query }) => {
          const session = requireSession(authSession);
          await requireOrgMembership(session.user.id, query.organizationId);

          const items = await db
            .select()
            .from(issueTemplates)
            .where(eq(issueTemplates.organizationId, query.organizationId))
            .orderBy(issueTemplates.name);

          return items.map(toTemplateDto);
        },
        {
          query: t.Object({
            organizationId: t.String(),
          }),
        },
      )
      .get(
        "/templates/:templateId",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const template = ensure(
            await db
              .select()
              .from(issueTemplates)
              .where(eq(issueTemplates.id, params.templateId))
              .get(),
            404,
            "Template not found",
          );
          await requireOrgMembership(session.user.id, template.organizationId);
          return toTemplateDto(template);
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
        },
      )
      .post(
        "/templates",
        async ({ authSession, body }) => {
          const session = requireSession(authSession);
          await requirePermission(session.user.id, body.organizationId, "template", "create");
          parseTemplateSchema(body.schema);

          const template = {
            id: crypto.randomUUID(),
            organizationId: body.organizationId,
            name: body.name.trim(),
            description: body.description.trim(),
            schema: body.schema,
            createdBy: session.user.id,
            createdAt: Date.now(),
          };

          await db.insert(issueTemplates).values(template);
          return toTemplateDto(template);
        },
        {
          body: t.Object({
            organizationId: t.String(),
            name: t.String(),
            description: t.String(),
            schema: t.String(),
          }),
        },
      )
      .patch(
        "/templates/:templateId",
        async ({ authSession, params, body }) => {
          const session = requireSession(authSession);
          const template = ensure(
            await db
              .select()
              .from(issueTemplates)
              .where(eq(issueTemplates.id, params.templateId))
              .get(),
            404,
            "Template not found",
          );
          await requirePermission(session.user.id, template.organizationId, "template", "update");
          if (body.schema) {
            parseTemplateSchema(body.schema);
          }

          await db
            .update(issueTemplates)
            .set({
              name: body.name?.trim() ?? template.name,
              description: body.description?.trim() ?? template.description,
              schema: body.schema ?? template.schema,
            })
            .where(eq(issueTemplates.id, template.id));

          const updated = ensure(
            await db.select().from(issueTemplates).where(eq(issueTemplates.id, template.id)).get(),
            404,
            "Template not found",
          );
          return toTemplateDto(updated);
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            schema: t.Optional(t.String()),
          }),
        },
      )
      .delete(
        "/templates/:templateId",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const template = ensure(
            await db
              .select()
              .from(issueTemplates)
              .where(eq(issueTemplates.id, params.templateId))
              .get(),
            404,
            "Template not found",
          );
          await requirePermission(session.user.id, template.organizationId, "template", "delete");
          await db.delete(issueTemplates).where(eq(issueTemplates.id, template.id));
          return {
            ok: true,
          };
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
        },
      )
      .get(
        "/issues",
        async ({ authSession, query }) => {
          const session = requireSession(authSession);
          await requireOrgMembership(session.user.id, query.organizationId);

          const filters = buildIssueFilters(query);
          const issueRows = await db
            .select()
            .from(issues)
            .where(and(...filters))
            .orderBy(desc(issues.number))
            .limit(PAGE_SIZE + 1);

          let filteredRows = issueRows;
          if (query.labelId) {
            const rows = await db
              .select()
              .from(issueLabels)
              .where(eq(issueLabels.labelId, query.labelId));
            const allowedIssueIds = new Set(rows.map((row) => row.issueId));
            filteredRows = issueRows.filter((row) => allowedIssueIds.has(row.id));
          }

          const items = filteredRows.slice(0, PAGE_SIZE);
          const labelMap = await getIssueLabelMap(items.map((issue) => issue.id));

          return {
            items: items.map((issue) => toIssueDto(issue, labelMap.get(issue.id) ?? [])),
            nextCursor:
              filteredRows.length > PAGE_SIZE ? `${filteredRows[PAGE_SIZE]?.number ?? ""}` : null,
          };
        },
        {
          query: t.Object({
            organizationId: t.String(),
            cursor: t.Optional(t.String()),
            status: t.Optional(t.String()),
            assigneeId: t.Optional(t.String()),
            labelId: t.Optional(t.String()),
            q: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/issues/by-number",
        async ({ authSession, query }) => {
          const session = requireSession(authSession);
          await requireOrgMembership(session.user.id, query.organizationId);

          const issue = await db
            .select()
            .from(issues)
            .where(
              and(eq(issues.organizationId, query.organizationId), eq(issues.number, query.number)),
            )
            .get();

          if (!issue) {
            return null;
          }

          const labelMap = await getIssueLabelMap([issue.id]);
          return toIssueDto(issue, labelMap.get(issue.id) ?? []);
        },
        {
          query: t.Object({
            organizationId: t.String(),
            number: t.Numeric(),
          }),
        },
      )
      .post(
        "/issues",
        async ({ authSession, body }) => {
          const session = requireSession(authSession);
          await requirePermission(session.user.id, body.organizationId, "issue", "create");
          invariant(body.title.trim().length > 0, 400, "Title is required");

          const setting = ensure(
            await db
              .select()
              .from(organizationSettings)
              .where(eq(organizationSettings.organizationId, body.organizationId))
              .get(),
            400,
            "Organization settings not found",
          );

          if (body.templateId) {
            const template = ensure(
              await db
                .select()
                .from(issueTemplates)
                .where(eq(issueTemplates.id, body.templateId))
                .get(),
              400,
              "Template not found",
            );
            invariant(template.organizationId === body.organizationId, 400, "Template not found");

            const schema = parseTemplateSchema(template.schema);
            const parsedTemplateData = body.templateData
              ? (JSON.parse(body.templateData) as Record<string, unknown>)
              : {};
            const validation = validateTemplateData(schema, parsedTemplateData);
            invariant(validation.valid, 400, validation.errors.join(", "));
          }

          const issueId = crypto.randomUUID();
          const timestamp = Date.now();
          await db.transaction(async (tx) => {
            await tx.insert(issues).values({
              id: issueId,
              organizationId: body.organizationId,
              number: setting.nextIssueNumber,
              title: body.title.trim(),
              description: body.description ?? null,
              status: "open",
              priority: body.priority,
              assigneeId: body.assigneeId ?? null,
              createdBy: session.user.id,
              templateId: body.templateId ?? null,
              templateData: body.templateData ?? null,
              createdAt: timestamp,
              updatedAt: timestamp,
              closedAt: null,
            });

            if (body.labelIds.length > 0) {
              await tx.insert(issueLabels).values(
                body.labelIds.map((labelId) => ({
                  issueId,
                  labelId,
                  createdAt: timestamp,
                })),
              );
            }

            if (body.attachmentIds.length > 0) {
              await tx
                .update(attachments)
                .set({
                  issueId,
                })
                .where(inArray(attachments.id, body.attachmentIds));
            }

            await tx
              .update(organizationSettings)
              .set({
                nextIssueNumber: setting.nextIssueNumber + 1,
                updatedAt: timestamp,
              })
              .where(eq(organizationSettings.organizationId, body.organizationId));
          });

          return {
            issueId,
            number: setting.nextIssueNumber,
          };
        },
        {
          body: t.Object({
            organizationId: t.String(),
            title: t.String(),
            description: t.Optional(t.Nullable(t.String())),
            priority: t.String(),
            assigneeId: t.Optional(t.Nullable(t.String())),
            labelIds: t.Array(t.String()),
            templateId: t.Optional(t.Nullable(t.String())),
            templateData: t.Optional(t.Nullable(t.String())),
            attachmentIds: t.Array(t.String()),
          }),
        },
      )
      .patch(
        "/issues/:issueId",
        async ({ authSession, params, body }) => {
          const session = requireSession(authSession);
          const issue = ensure(
            await db.select().from(issues).where(eq(issues.id, params.issueId)).get(),
            404,
            "Issue not found",
          );
          await requirePermission(session.user.id, issue.organizationId, "issue", "update");

          await db.transaction(async (tx) => {
            await tx
              .update(issues)
              .set({
                title: body.title?.trim() ?? issue.title,
                description: body.description ?? issue.description,
                priority: body.priority ?? issue.priority,
                templateData: body.templateData ?? issue.templateData,
                updatedAt: Date.now(),
              })
              .where(eq(issues.id, issue.id));

            if (body.labelIds) {
              await tx.delete(issueLabels).where(eq(issueLabels.issueId, issue.id));
              if (body.labelIds.length > 0) {
                await tx.insert(issueLabels).values(
                  body.labelIds.map((labelId) => ({
                    issueId: issue.id,
                    labelId,
                    createdAt: Date.now(),
                  })),
                );
              }
            }
          });

          const updated = ensure(
            await db.select().from(issues).where(eq(issues.id, issue.id)).get(),
            404,
            "Issue not found",
          );
          const labelMap = await getIssueLabelMap([updated.id]);
          return toIssueDto(updated, labelMap.get(updated.id) ?? []);
        },
        {
          params: t.Object({
            issueId: t.String(),
          }),
          body: t.Object({
            title: t.Optional(t.String()),
            description: t.Optional(t.Nullable(t.String())),
            priority: t.Optional(t.String()),
            labelIds: t.Optional(t.Array(t.String())),
            templateData: t.Optional(t.Nullable(t.String())),
          }),
        },
      )
      .post(
        "/issues/:issueId/status",
        async ({ authSession, params, body }) => {
          const session = requireSession(authSession);
          const issue = ensure(
            await db.select().from(issues).where(eq(issues.id, params.issueId)).get(),
            404,
            "Issue not found",
          );
          await requirePermission(session.user.id, issue.organizationId, "issue", "close");

          const nextClosedAt = body.status === "closed" ? Date.now() : null;
          await db
            .update(issues)
            .set({
              status: body.status,
              updatedAt: Date.now(),
              closedAt: nextClosedAt,
            })
            .where(eq(issues.id, issue.id));

          return {
            ok: true,
          };
        },
        {
          params: t.Object({
            issueId: t.String(),
          }),
          body: t.Object({
            status: t.String(),
          }),
        },
      )
      .delete(
        "/issues/:issueId",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const issue = ensure(
            await db.select().from(issues).where(eq(issues.id, params.issueId)).get(),
            404,
            "Issue not found",
          );
          await requirePermission(session.user.id, issue.organizationId, "issue", "delete");

          const issueAttachments = await db
            .select()
            .from(attachments)
            .where(eq(attachments.issueId, issue.id));

          for (const attachment of issueAttachments) {
            await utapi.deleteFiles(attachment.providerKey);
          }

          await db.delete(issues).where(eq(issues.id, issue.id));
          return {
            ok: true,
          };
        },
        {
          params: t.Object({
            issueId: t.String(),
          }),
        },
      )
      .get(
        "/issues/:issueId/attachments",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const issue = ensure(
            await db.select().from(issues).where(eq(issues.id, params.issueId)).get(),
            404,
            "Issue not found",
          );
          await requireOrgMembership(session.user.id, issue.organizationId);

          const records = await db
            .select()
            .from(attachments)
            .where(eq(attachments.issueId, issue.id))
            .orderBy(desc(attachments.createdAt));

          return await Promise.all(records.map((attachment) => toAttachmentDto(attachment)));
        },
        {
          params: t.Object({
            issueId: t.String(),
          }),
        },
      )
      .delete(
        "/attachments/:attachmentId",
        async ({ authSession, params }) => {
          const session = requireSession(authSession);
          const attachment = ensure(
            await db
              .select()
              .from(attachments)
              .where(eq(attachments.id, params.attachmentId))
              .get(),
            404,
            "Attachment not found",
          );

          if (attachment.issueId) {
            const issue = ensure(
              await db.select().from(issues).where(eq(issues.id, attachment.issueId)).get(),
              404,
              "Issue not found",
            );
            await requirePermission(session.user.id, issue.organizationId, "issue", "update");
          } else {
            invariant(
              attachment.uploadedByUserId === session.user.id,
              403,
              "You cannot remove this attachment",
            );
          }

          await utapi.deleteFiles(attachment.providerKey);
          await db.delete(attachments).where(eq(attachments.id, attachment.id));
          return {
            ok: true,
          };
        },
        {
          params: t.Object({
            attachmentId: t.String(),
          }),
        },
      ),
  );

export type App = typeof app;
export { app };

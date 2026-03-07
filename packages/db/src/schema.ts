import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    username: text("username").unique(),
    displayUsername: text("display_username"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("user_username_unique").on(table.username),
  }),
);

export const sessions = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeOrganizationId: text("active_organization_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    userIdx: index("session_user_idx").on(table.userId),
  }),
);

export const accounts = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userIdx: index("account_user_idx").on(table.userId),
  }),
);

export const verifications = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);

export const organizations = sqliteTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("organization_slug_unique").on(table.slug),
  }),
);

export const members = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    orgUserIdx: uniqueIndex("member_org_user_unique").on(table.organizationId, table.userId),
    userIdx: index("member_user_idx").on(table.userId),
  }),
);

export const invitations = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    orgEmailIdx: index("invitation_org_email_idx").on(table.organizationId, table.email),
  }),
);

export const organizationSettings = sqliteTable("organization_settings", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  nextIssueNumber: integer("next_issue_number").notNull().default(1),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export const labels = sqliteTable(
  "labels",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    color: text("color").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    orgNameIdx: uniqueIndex("labels_org_name_unique").on(
      table.organizationId,
      table.normalizedName,
    ),
    orgIdx: index("labels_org_idx").on(table.organizationId),
  }),
);

export const issueTemplates = sqliteTable(
  "issue_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    schema: text("schema").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    orgIdx: index("templates_org_idx").on(table.organizationId),
  }),
);

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull(),
    priority: text("priority").notNull(),
    assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: text("template_id").references(() => issueTemplates.id, { onDelete: "set null" }),
    templateData: text("template_data"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    closedAt: integer("closed_at", { mode: "number" }),
  },
  (table) => ({
    orgNumberIdx: uniqueIndex("issues_org_number_unique").on(table.organizationId, table.number),
    orgStatusIdx: index("issues_org_status_idx").on(table.organizationId, table.status),
    orgPriorityIdx: index("issues_org_priority_idx").on(table.organizationId, table.priority),
    assigneeIdx: index("issues_assignee_idx").on(table.organizationId, table.assigneeId),
  }),
);

export const issueLabels = sqliteTable(
  "issue_labels",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.issueId, table.labelId] }),
    labelIdx: index("issue_labels_label_idx").on(table.labelId),
  }),
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id, { onDelete: "cascade" }),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerKey: text("provider_key").notNull().unique(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    issueIdx: index("attachments_issue_idx").on(table.issueId),
    orgIdx: index("attachments_org_idx").on(table.organizationId),
  }),
);

export const schema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  organization: organizations,
  member: members,
  invitation: invitations,
  organizationSettings,
  labels,
  issueTemplates,
  issues,
  issueLabels,
  attachments,
} as const;

export type UserRecord = typeof users.$inferSelect;
export type SessionRecord = typeof sessions.$inferSelect;
export type OrganizationRecord = typeof organizations.$inferSelect;
export type MemberRecord = typeof members.$inferSelect;
export type LabelRecord = typeof labels.$inferSelect;
export type IssueTemplateRecord = typeof issueTemplates.$inferSelect;
export type IssueRecord = typeof issues.$inferSelect;
export type AttachmentRecord = typeof attachments.$inferSelect;

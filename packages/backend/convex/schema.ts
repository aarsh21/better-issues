import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  labels: defineTable({
    organizationId: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  issueTemplates: defineTable({
    organizationId: v.string(),
    name: v.string(),
    description: v.string(),
    schema: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  issues: defineTable({
    organizationId: v.string(),
    number: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("closed")),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    assigneeId: v.optional(v.string()),
    labelIds: v.array(v.id("labels")),
    createdBy: v.string(),
    templateId: v.optional(v.id("issueTemplates")),
    templateData: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_org_and_number", ["organizationId", "number"])
    .index("by_assignee", ["assigneeId"])
    .searchIndex("search_issues", {
      searchField: "title",
      filterFields: ["organizationId", "status"],
    }),
});

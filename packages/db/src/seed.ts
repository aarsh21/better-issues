import { eq } from "drizzle-orm";

import { db, labels, organizationSettings, organizations } from "./index";
import { DEFAULT_LABELS } from "./default-labels";

const now = Date.now();

async function main() {
  const orgs = await db.select().from(organizations);

  for (const organization of orgs) {
    const existingSettings = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organization.id))
      .get();

    if (!existingSettings) {
      await db.insert(organizationSettings).values({
        organizationId: organization.id,
        nextIssueNumber: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

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
        createdAt: now,
      });
    }
  }
}

void main();

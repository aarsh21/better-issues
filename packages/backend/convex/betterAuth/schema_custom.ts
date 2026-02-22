import { defineSchema } from "convex/server";

import { tables as generatedTables } from "./schema";

const memberTable = generatedTables.member.index("by_organization_user_lookup", [
  "organizationId",
  "userId",
]);

export const tables = {
  ...generatedTables,
  member: memberTable,
};

const schema = defineSchema(tables);

export default schema;

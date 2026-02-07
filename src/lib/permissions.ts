import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

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

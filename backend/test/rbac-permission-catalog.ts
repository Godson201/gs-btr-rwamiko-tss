import {
  DEFAULT_ROLE_PERMISSION_GRANTS,
  assertDefaultGrantIsImplemented,
} from '../src/modules/rbac/default-role-permissions';
import {
  PERMISSION_DEFINITIONS,
  getPermissionDefinition,
} from '../src/modules/rbac/permission.catalog';
import { SCHOOL_ROLE_CODES } from '../src/modules/rbac/school-role.catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const permissionCodes = PERMISSION_DEFINITIONS.map((permission) => permission.code);
assert(
  new Set(permissionCodes).size === permissionCodes.length,
  'Permission codes must be unique',
);

const roleCodes = new Set<string>(SCHOOL_ROLE_CODES);
const grantKeys = new Set<string>();
for (const grant of DEFAULT_ROLE_PERMISSION_GRANTS) {
  assert(roleCodes.has(grant.role), `Unknown role in default grant: ${grant.role}`);
  getPermissionDefinition(grant.permission);
  assertDefaultGrantIsImplemented(grant);
  const key = `${grant.role}:${grant.permission}`;
  assert(!grantKeys.has(key), `Duplicate default role-permission grant: ${key}`);
  grantKeys.add(key);
}

const systemAdminPermissions = DEFAULT_ROLE_PERMISSION_GRANTS
  .filter((grant) => grant.role === 'SYSTEM_ADMIN')
  .map((grant) => grant.permission);
for (const forbidden of ['academic.manage', 'marks.approve', 'discipline.approve_sanction']) {
  assert(
    !systemAdminPermissions.includes(forbidden as never),
    `System Administrator must not implicitly receive ${forbidden}`,
  );
}

for (const planned of [
  'marks.approve',
  'marks.publish',
  'discipline.approve_sanction',
  'boarding.welfare.record',
] as const) {
  assert(getPermissionDefinition(planned).implementation === 'PLANNED', `${planned} must remain planned`);
}

console.log(
  `RBAC permission catalogue passed: ${PERMISSION_DEFINITIONS.length} permissions and ${DEFAULT_ROLE_PERMISSION_GRANTS.length} conservative default grants.`,
);

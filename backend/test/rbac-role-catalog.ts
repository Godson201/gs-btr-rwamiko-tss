import {
  CORE_SCHOOL_ROLE_CODES,
  EXTENDED_SCHOOL_ROLE_CODES,
  LEGACY_PORTAL_ROLE_MAP,
  LEGACY_STAFF_TITLE_ROLE_MAP,
  SCHOOL_ROLE_CODES,
  SCHOOL_ROLE_DEFINITIONS,
  getSchoolRoleDefinition,
} from '../src/modules/rbac/school-role.catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  assert(actual === expected, `${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertJsonEqual(actual: unknown, expected: unknown, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

const codes = SCHOOL_ROLE_DEFINITIONS.map((definition) => definition.code);
assertEqual(new Set(codes).size, codes.length, 'School role codes must be unique');
assertJsonEqual(codes, [...SCHOOL_ROLE_CODES], 'Every declared code needs exactly one definition');

for (const code of CORE_SCHOOL_ROLE_CODES) {
  assertEqual(getSchoolRoleDefinition(code).stage, 'CORE', `${code} must be a core role`);
}
for (const code of EXTENDED_SCHOOL_ROLE_CODES) {
  assertEqual(getSchoolRoleDefinition(code).stage, 'DEFERRED', `${code} must be deferred`);
}

assertJsonEqual(LEGACY_STAFF_TITLE_ROLE_MAP, {
  HEAD_TEACHER: 'HEAD_TEACHER',
  DIRECTOR_OF_STUDIES: 'DOS',
  DIRECTOR_OF_DISCIPLINE: 'DOD',
  PATRON: 'PATRON',
  MATRON: 'MATRON',
}, 'Legacy staff titles must have stable backfill mappings');
assertJsonEqual(LEGACY_PORTAL_ROLE_MAP, {
  TEACHER: 'TEACHER',
  ADMIN: 'SYSTEM_ADMIN',
  SUPER_ADMIN: 'SYSTEM_ADMIN',
}, 'Legacy portal roles must have stable backfill mappings');

assertEqual(
  getSchoolRoleDefinition('SYSTEM_ADMIN').profileRequirement,
  'ADMIN_PROFILE',
  'System administrators require an admin profile',
);
assertEqual(
  getSchoolRoleDefinition('HOD').profileRequirement,
  'TEACHER_PROFILE',
  'Heads of department require a teacher profile',
);
assertEqual(
  getSchoolRoleDefinition('ACCOUNTANT').profileRequirement,
  'FUTURE_STAFF_PROFILE',
  'Deferred non-teaching roles require a future staff profile',
);

console.log(
  `RBAC school-role catalogue passed: ${CORE_SCHOOL_ROLE_CODES.length} core and ${EXTENDED_SCHOOL_ROLE_CODES.length} deferred roles.`,
);

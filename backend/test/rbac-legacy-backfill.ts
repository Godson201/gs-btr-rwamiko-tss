import { deriveLegacySchoolRoleAssignments } from '../prisma/rbac-seed';

function assertDeepEqual(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function roles(user: Parameters<typeof deriveLegacySchoolRoleAssignments>[0]) {
  return deriveLegacySchoolRoleAssignments(user)
    .map((assignment) => `${assignment.role}:${assignment.source}`)
    .sort();
}

assertDeepEqual(
  roles({
    id: 'admin',
    role: 'SUPER_ADMIN',
    portalAccess: ['SUPER_ADMIN'],
    teacher: null,
  }),
  ['SYSTEM_ADMIN:LEGACY_PORTAL_ROLE'],
);

assertDeepEqual(
  roles({
    id: 'dos-teacher',
    role: 'TEACHER',
    portalAccess: ['TEACHER', 'ADMIN'],
    teacher: {
      staffTitle: 'DIRECTOR_OF_STUDIES',
      classes: [{ isClassMaster: true }],
    },
  }),
  [
    'CLASS_TEACHER:LEGACY_CLASS_MASTER',
    'DOS:LEGACY_STAFF_TITLE',
    'SYSTEM_ADMIN:LEGACY_PORTAL_ROLE',
    'TEACHER:LEGACY_PORTAL_ROLE',
  ],
);

assertDeepEqual(
  roles({
    id: 'teacher-profile',
    role: 'ADMIN',
    portalAccess: ['ADMIN'],
    teacher: { staffTitle: null, classes: [{ isClassMaster: false }] },
  }),
  [
    'SYSTEM_ADMIN:LEGACY_PORTAL_ROLE',
    'TEACHER:LEGACY_PORTAL_ROLE',
  ],
);

assertDeepEqual(
  roles({
    id: 'parent',
    role: 'PARENT',
    portalAccess: ['PARENT'],
    teacher: null,
  }),
  [],
);

console.log('RBAC legacy-role backfill mapping checks passed.');

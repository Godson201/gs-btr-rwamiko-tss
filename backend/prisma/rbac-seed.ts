import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLE_PERMISSION_GRANTS } from '../src/modules/rbac/default-role-permissions';
import {
  LEGACY_PORTAL_ROLE_MAP,
  LEGACY_STAFF_TITLE_ROLE_MAP,
  SCHOOL_ROLE_DEFINITIONS,
  SchoolRoleCode,
} from '../src/modules/rbac/school-role.catalog';
import { PERMISSION_DEFINITIONS } from '../src/modules/rbac/permission.catalog';

type LegacyPortalRole = keyof typeof LEGACY_PORTAL_ROLE_MAP;
type LegacyStaffTitle = keyof typeof LEGACY_STAFF_TITLE_ROLE_MAP;

export interface LegacyRoleUser {
  id: string;
  role: string;
  portalAccess: string[];
  teacher: null | {
    staffTitle: string | null;
    classes: Array<{ isClassMaster: boolean }>;
  };
}

export interface LegacyRoleAssignment {
  role: SchoolRoleCode;
  source:
    | 'LEGACY_PORTAL_ROLE'
    | 'LEGACY_STAFF_TITLE'
    | 'LEGACY_CLASS_MASTER';
}

function mappedPortalRole(role: string): SchoolRoleCode | undefined {
  return LEGACY_PORTAL_ROLE_MAP[role as LegacyPortalRole];
}

export function deriveLegacySchoolRoleAssignments(
  user: LegacyRoleUser,
): LegacyRoleAssignment[] {
  const assignments = new Map<SchoolRoleCode, LegacyRoleAssignment['source']>();
  const portalRoles = new Set([user.role, ...user.portalAccess]);

  for (const portalRole of portalRoles) {
    const schoolRole = mappedPortalRole(portalRole);
    if (schoolRole) assignments.set(schoolRole, 'LEGACY_PORTAL_ROLE');
  }

  // A teacher profile is the strongest compatibility signal for retaining the
  // existing teacher capability, even if the user's primary portal changes.
  if (user.teacher) assignments.set('TEACHER', 'LEGACY_PORTAL_ROLE');

  if (user.teacher?.staffTitle) {
    const schoolRole =
      LEGACY_STAFF_TITLE_ROLE_MAP[user.teacher.staffTitle as LegacyStaffTitle];
    if (schoolRole) assignments.set(schoolRole, 'LEGACY_STAFF_TITLE');
  }

  if (user.teacher?.classes.some((assignment) => assignment.isClassMaster)) {
    assignments.set('CLASS_TEACHER', 'LEGACY_CLASS_MASTER');
  }

  return [...assignments].map(([role, source]) => ({ role, source }));
}

export async function seedRbac(prisma: PrismaClient): Promise<void> {
  const schoolRoleIds = new Map<SchoolRoleCode, string>();

  for (const definition of SCHOOL_ROLE_DEFINITIONS) {
    const role = await prisma.schoolRole.upsert({
      where: { code: definition.code },
      update: {
        label: definition.label,
        description: definition.description,
      },
      create: {
        code: definition.code,
        label: definition.label,
        description: definition.description,
        isActive: definition.stage === 'CORE',
      },
      select: { id: true },
    });
    schoolRoleIds.set(definition.code, role.id);
  }

  const permissionIds = new Map<string, string>();
  for (const definition of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: definition.code },
      update: {
        description: definition.description,
        // Permission implementation state is code-owned until a dedicated
        // permission-management workflow exists.
        isActive: definition.implementation === 'IMPLEMENTED',
      },
      create: {
        code: definition.code,
        description: definition.description,
        isActive: definition.implementation === 'IMPLEMENTED',
      },
      select: { id: true },
    });
    permissionIds.set(definition.code, permission.id);
  }

  for (const grant of DEFAULT_ROLE_PERMISSION_GRANTS) {
    const schoolRoleId = schoolRoleIds.get(grant.role);
    const permissionId = permissionIds.get(grant.permission);
    if (!schoolRoleId || !permissionId) {
      throw new Error(`Missing RBAC definition for ${grant.role}:${grant.permission}`);
    }

    await prisma.schoolRolePermission.upsert({
      where: { schoolRoleId_permissionId: { schoolRoleId, permissionId } },
      update: { scopeMode: grant.scope },
      create: { schoolRoleId, permissionId, scopeMode: grant.scope },
    });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      portalAccess: true,
      teacher: {
        select: {
          staffTitle: true,
          classes: { select: { isClassMaster: true } },
        },
      },
    },
  });

  let assignmentCount = 0;
  for (const user of users) {
    for (const assignment of deriveLegacySchoolRoleAssignments(user)) {
      const schoolRoleId = schoolRoleIds.get(assignment.role);
      if (!schoolRoleId) throw new Error(`Missing school role: ${assignment.role}`);

      await prisma.userSchoolRole.upsert({
        where: { userId_schoolRoleId: { userId: user.id, schoolRoleId } },
        update: {},
        create: {
          userId: user.id,
          schoolRoleId,
          source: assignment.source,
        },
      });
      assignmentCount += 1;
    }
  }

  console.log(
    `Ensured ${SCHOOL_ROLE_DEFINITIONS.length} school roles, ` +
      `${PERMISSION_DEFINITIONS.length} permissions, ` +
      `${DEFAULT_ROLE_PERMISSION_GRANTS.length} default grants and ` +
      `${assignmentCount} legacy user-role mappings.`,
  );
}

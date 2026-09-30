import { PermissionScopeMode } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { PermissionAccessService } from '../src/modules/rbac/permission-access.service';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const prisma = {
  userSchoolRole: {
    findMany: async () => [
      {
        schoolRole: {
          code: 'TEACHER',
          label: 'Teacher / Trainer',
          permissions: [
            {
              scopeMode: PermissionScopeMode.SELF,
              permission: { code: 'teaching.assignment.view' },
            },
          ],
        },
        departmentScopes: [],
      },
      {
        schoolRole: {
          code: 'HOD',
          label: 'Head of Department',
          permissions: [
            {
              scopeMode: PermissionScopeMode.DEPARTMENT,
              permission: { code: 'department.view' },
            },
          ],
        },
        departmentScopes: [{ departmentId: 'CSA' }],
      },
      {
        schoolRole: {
          code: 'HEAD_TEACHER',
          label: 'Head Teacher',
          permissions: [
            {
              scopeMode: PermissionScopeMode.SCHOOL,
              permission: { code: 'academic.view' },
            },
          ],
        },
        departmentScopes: [],
      },
    ],
  },
} as unknown as PrismaService;

async function main() {
  const access = new PermissionAccessService(prisma);
  const resolved = await access.resolve('user-1');

  assert(resolved.size === 3, 'Permissions from multiple roles must coexist');
  assert(
    await access.hasEveryPermission('user-1', ['academic.view', 'department.view']),
    'ALL matching must accept every assigned permission',
  );
  assert(
    !(await access.hasEveryPermission('user-1', ['academic.view', 'users.create'])),
    'ALL matching must reject a missing permission',
  );
  assert(
    await access.hasAnyPermission('user-1', ['users.create', 'academic.view']),
    'ANY matching must accept one assigned permission',
  );
  assert(
    await access.permitsDepartment('user-1', 'department.view', 'CSA'),
    'Department scope must allow an assigned department',
  );
  assert(
    !(await access.permitsDepartment('user-1', 'department.view', 'NIT')),
    'Department scope must reject an unassigned department',
  );
  assert(
    await access.permitsDepartment('user-1', 'academic.view', 'NIT'),
    'School scope must allow every department',
  );
  const summary = await access.getAccessSummary('user-1');
  assert(summary.permissions.includes('academic.view'), 'Access summary must expose effective permission codes');
  assert(summary.schoolRoles.some((role) => role.code === 'HOD'), 'Access summary must expose active roles');

  console.log('RBAC permission resolution and scope checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

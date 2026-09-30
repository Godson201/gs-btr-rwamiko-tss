import assert from 'node:assert/strict';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../src/database/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { RoleAssignmentService } from '../src/modules/rbac/role-assignment.service';

type Assignment = {
  id: string;
  userId: string;
  schoolRoleId: string;
  assignedById?: string;
  isActive: boolean;
  source: string;
};

const roles = [
  'TEACHER',
  'DOS',
  'HOD',
  'SYSTEM_ADMIN',
  'ACCOUNTANT',
].map((code) => ({ id: `role-${code}`, code, label: code, isActive: true }));
const assignments: Assignment[] = [
  {
    id: 'assignment-teacher',
    userId: 'teacher-user',
    schoolRoleId: 'role-TEACHER',
    isActive: true,
    source: 'LEGACY_PORTAL_ROLE',
  },
];
const departmentScopes: Array<{ userSchoolRoleId: string; departmentId: string }> = [];

const prisma = {
  user: {
    findUnique: async ({ where }: any) =>
      where.id === 'teacher-user'
        ? { id: 'teacher-user', email: 'teacher@example.invalid', firstName: 'Test', lastName: 'Teacher', teacher: { id: 'teacher-profile' }, admin: null }
        : where.id === 'admin-user'
          ? { id: 'admin-user', email: 'admin@example.invalid', firstName: 'Test', lastName: 'Admin', teacher: null, admin: { id: 'admin-profile' } }
          : null,
  },
  schoolRole: {
    findUnique: async ({ where }: any) => roles.find((role) => role.code === where.code) ?? null,
  },
  department: {
    count: async ({ where }: any) =>
      ['department-csa', 'department-nit'].filter((id) => where.id.in.includes(id)).length,
  },
  teacher: {
    findUnique: async ({ where }: any) =>
      where.userId === 'teacher-user' ? { id: 'teacher-profile' } : null,
    update: async () => ({ id: 'teacher-profile' }),
    updateMany: async () => ({ count: 1 }),
  },
  userSchoolRole: {
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const assignment of assignments) {
        const code = roles.find((role) => role.id === assignment.schoolRoleId)?.code;
        if (
          assignment.userId === where.userId &&
          assignment.isActive === where.isActive &&
          assignment.schoolRoleId !== where.schoolRoleId.not &&
          where.schoolRole.code.in.includes(code)
        ) {
          Object.assign(assignment, data);
          count += 1;
        }
      }
      return { count };
    },
    findUnique: async ({ where }: any) => {
      const key = where.userId_schoolRoleId;
      return assignments.find(
        (item) => item.userId === key.userId && item.schoolRoleId === key.schoolRoleId,
      ) ?? null;
    },
    upsert: async ({ where, update, create }: any) => {
      const key = where.userId_schoolRoleId;
      const existing = assignments.find(
        (item) => item.userId === key.userId && item.schoolRoleId === key.schoolRoleId,
      );
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const created = {
        id: `assignment-${assignments.length + 1}`,
        isActive: true,
        ...create,
      } as Assignment;
      assignments.push(created);
      return created;
    },
    update: async ({ where, data }: any) => {
      const assignment = assignments.find((item) => item.id === where.id)!;
      Object.assign(assignment, data);
      return assignment;
    },
  },
  userSchoolRoleDepartment: {
    deleteMany: async ({ where }: any) => {
      for (let index = departmentScopes.length - 1; index >= 0; index -= 1) {
        if (departmentScopes[index].userSchoolRoleId === where.userSchoolRoleId) {
          departmentScopes.splice(index, 1);
        }
      }
      return { count: 0 };
    },
    createMany: async ({ data }: any) => {
      departmentScopes.push(...data);
      return { count: data.length };
    },
  },
  $transaction: async (operation: (client: any) => Promise<unknown>) => operation(prisma),
} as unknown as PrismaService;

const responsibilityEmails: string[] = [];
const mail = {
  sendResponsibilityChangedEmail: async (_to: string, _name: string, responsibility: string) => {
    responsibilityEmails.push(responsibility);
  },
} as unknown as MailService;

async function expectError(
  action: () => Promise<unknown>,
  ErrorType: typeof BadRequestException | typeof ForbiddenException,
) {
  await assert.rejects(action, ErrorType);
}

async function main() {
  const service = new RoleAssignmentService(prisma, mail);

  await expectError(
    () => service.assign('teacher-user', 'teacher-user', 'DOS'),
    ForbiddenException,
  );
  await expectError(
    () => service.assign('admin-user', 'teacher-user', 'HOD'),
    BadRequestException,
  );
  await expectError(
    () => service.assign('admin-user', 'teacher-user', 'DOS', ['department-csa']),
    BadRequestException,
  );
  await expectError(
    () => service.assign('admin-user', 'teacher-user', 'HOD', ['missing-department']),
    BadRequestException,
  );
  await expectError(
    () => service.assign('admin-user', 'teacher-user', 'ACCOUNTANT'),
    BadRequestException,
  );

  const dosAssignment = await service.assign('admin-user', 'teacher-user', 'DOS');
  const hodAssignment = await service.assign('admin-user', 'teacher-user', 'HOD', ['department-csa']);
  assert.equal(dosAssignment.notificationSent, true);
  assert.equal(hodAssignment.notificationSent, true);

  const activeCodes = assignments
    .filter((assignment) => assignment.isActive)
    .map((assignment) => roles.find((role) => role.id === assignment.schoolRoleId)!.code)
    .sort();
  assert.deepEqual(activeCodes, ['HOD']);
  assert.deepEqual(departmentScopes, [{
    userSchoolRoleId: assignments.find((item) => item.schoolRoleId === 'role-HOD')!.id,
    departmentId: 'department-csa',
  }]);

  assert.deepEqual(responsibilityEmails, ['DOS', 'HOD']);

  await service.remove('admin-user', 'teacher-user', 'HOD');
  assert.equal(
    assignments.find((assignment) => assignment.schoolRoleId === 'role-HOD')!.isActive,
    false,
  );
  await expectError(
    () => service.remove('admin-user', 'teacher-user', 'TEACHER'),
    BadRequestException,
  );
  await expectError(
    () => service.remove('teacher-user', 'teacher-user', 'HOD'),
    ForbiddenException,
  );

  console.log(
    'RBAC role-assignment checks passed: validation, exclusive responsibility replacement, scoped HoD assignment, email and removal.',
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

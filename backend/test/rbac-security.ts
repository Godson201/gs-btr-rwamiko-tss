import 'reflect-metadata';
import assert from 'node:assert/strict';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../src/guards/roles.guard';
import { DEFAULT_ROLE_PERMISSION_GRANTS } from '../src/modules/rbac/default-role-permissions';
import { RoleAssignmentService } from '../src/modules/rbac/role-assignment.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { PrismaService } from '../src/database/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';

function roleContext(portalAccess?: Role[]): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => ({ user: portalAccess ? { portalAccess } : undefined }) }),
  } as unknown as ExecutionContext;
}

function expectSyncError(action: () => unknown, ErrorType: typeof ForbiddenException) {
  assert.throws(action, ErrorType);
}

async function expectAsyncError(
  action: () => Promise<unknown>,
  ErrorType: typeof ForbiddenException | typeof UnauthorizedException,
) {
  await assert.rejects(action, ErrorType);
}

function permissionsFor(role: string) {
  return new Set(
    DEFAULT_ROLE_PERMISSION_GRANTS
      .filter((grant) => grant.role === role)
      .map((grant) => grant.permission),
  );
}

async function main() {
  let requiredRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
  const rolesGuard = new RolesGuard(reflector);

  expectSyncError(() => rolesGuard.canActivate(roleContext()), ForbiddenException);
  expectSyncError(() => rolesGuard.canActivate(roleContext([Role.TEACHER])), ForbiddenException);
  assert.equal(rolesGuard.canActivate(roleContext([Role.ADMIN])), true);

  // A DoS, DoD, HoD, Patron or Matron retains the TEACHER portal identity and
  // cannot enter legacy system-administration routes through a school role.
  expectSyncError(
    () => rolesGuard.canActivate(roleContext([Role.TEACHER])),
    ForbiddenException,
  );

  requiredRoles = [Role.TEACHER];
  expectSyncError(() => rolesGuard.canActivate(roleContext([Role.PARENT])), ForbiddenException);

  const systemAdmin = permissionsFor('SYSTEM_ADMIN');
  assert.ok(systemAdmin.has('users.assign_role'));
  assert.ok(systemAdmin.has('system.audit.view'));
  assert.ok(!systemAdmin.has('academic.manage'));
  assert.ok(!systemAdmin.has('academic.curriculum.manage'));

  const dos = permissionsFor('DOS');
  assert.ok(dos.has('academic.manage'));
  assert.ok(!dos.has('users.assign_role'));
  assert.ok(!dos.has('system.audit.view'));

  const teacher = permissionsFor('TEACHER');
  assert.ok(teacher.has('teaching.assignment.view'));
  assert.ok(!teacher.has('academic.manage'));
  assert.ok(!teacher.has('users.assign_role'));

  const hod = permissionsFor('HOD');
  assert.ok(hod.has('department.view'));
  assert.ok(!hod.has('academic.manage'));

  for (const role of ['DOD', 'PATRON', 'MATRON']) {
    const grants = permissionsFor(role);
    assert.equal(grants.size, 0, `${role} must receive no grant before its protected workflow exists`);
  }

  const assignments = new RoleAssignmentService({} as PrismaService, {} as MailService);
  await expectAsyncError(
    () => assignments.assign('same-user', 'same-user', 'DOS'),
    ForbiddenException,
  );
  await expectAsyncError(
    () => assignments.remove('same-user', 'same-user', 'DOS'),
    ForbiddenException,
  );

  const config = {
    getOrThrow: () => 'security-test-jwt-secret',
  } as unknown as ConfigService;
  const inactivePrisma = {
    user: {
      findUnique: async () => ({ id: 'inactive-user', isActive: false }),
    },
  } as unknown as PrismaService;
  const strategy = new JwtStrategy(config, inactivePrisma);
  await expectAsyncError(
    () => strategy.validate({
      sub: 'inactive-user',
      email: 'inactive@example.invalid',
      role: Role.TEACHER,
      portalAccess: [Role.TEACHER],
      accountStatus: 'ACTIVE',
    }),
    UnauthorizedException,
  );

  console.log(
    'RBAC security checks passed: portal isolation, permission separation, self-role denial and inactive-account blocking.',
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequiredPermissions } from '../src/decorators/permissions.decorator';
import { PermissionsGuard } from '../src/guards/permissions.guard';
import { PermissionAccessService } from '../src/modules/rbac/permission-access.service';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function context(user?: { id: string }): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

async function expectError(
  action: () => Promise<unknown>,
  ErrorType: typeof ForbiddenException | typeof UnauthorizedException,
) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof ErrorType, `Expected ${ErrorType.name}`);
    return;
  }
  throw new Error(`Expected ${ErrorType.name}`);
}

async function main() {
  let requirement: RequiredPermissions | undefined;
  let allResult = true;
  let anyResult = true;
  let receivedUserId = '';

  const reflector = {
    getAllAndOverride: () => requirement,
  } as unknown as Reflector;
  const permissionAccess = {
    hasEveryPermission: async (userId: string) => {
      receivedUserId = userId;
      return allResult;
    },
    hasAnyPermission: async (userId: string) => {
      receivedUserId = userId;
      return anyResult;
    },
  } as unknown as PermissionAccessService;
  const guard = new PermissionsGuard(reflector, permissionAccess);

  assert(await guard.canActivate(context()), 'Routes without permission metadata remain unchanged');

  requirement = { permissions: ['users.view'], match: 'ALL' };
  await expectError(() => guard.canActivate(context()), UnauthorizedException);

  allResult = false;
  await expectError(() => guard.canActivate(context({ id: 'teacher-1' })), ForbiddenException);

  allResult = true;
  assert(await guard.canActivate(context({ id: 'admin-1' })), 'ALL permission match must pass');
  assert(receivedUserId === 'admin-1', 'Guard must authorize the authenticated user');

  requirement = { permissions: ['academic.view', 'department.view'], match: 'ANY' };
  anyResult = true;
  assert(await guard.canActivate(context({ id: 'hod-1' })), 'ANY permission match must pass');

  anyResult = false;
  await expectError(() => guard.canActivate(context({ id: 'parent-1' })), ForbiddenException);

  console.log('RBAC permissions guard checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

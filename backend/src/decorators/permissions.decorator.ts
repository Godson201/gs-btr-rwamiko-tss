import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '../modules/rbac/permission.catalog';

export const PERMISSIONS_KEY = 'rbac_permissions';

export type PermissionMatchMode = 'ALL' | 'ANY';

export interface RequiredPermissions {
  permissions: PermissionCode[];
  match: PermissionMatchMode;
}

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, match: 'ALL' } satisfies RequiredPermissions);

export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, match: 'ANY' } satisfies RequiredPermissions);

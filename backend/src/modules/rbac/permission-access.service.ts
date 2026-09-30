import { Injectable } from '@nestjs/common';
import { PermissionScopeMode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PermissionCode } from './permission.catalog';

export interface PermissionGrant {
  roleCode: string;
  scope: PermissionScopeMode;
  departmentIds: readonly string[];
}

export type ResolvedPermissions = ReadonlyMap<PermissionCode, readonly PermissionGrant[]>;

@Injectable()
export class PermissionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<ResolvedPermissions> {
    const assignments = await this.prisma.userSchoolRole.findMany({
      where: {
        userId,
        isActive: true,
        schoolRole: { isActive: true },
      },
      select: {
        schoolRole: {
          select: {
            code: true,
            permissions: {
              where: { permission: { isActive: true } },
              select: {
                scopeMode: true,
                permission: { select: { code: true } },
              },
            },
          },
        },
        departmentScopes: { select: { departmentId: true } },
      },
    });

    const resolved = new Map<PermissionCode, PermissionGrant[]>();
    for (const assignment of assignments) {
      const departmentIds = assignment.departmentScopes.map((scope) => scope.departmentId);
      for (const rolePermission of assignment.schoolRole.permissions) {
        const code = rolePermission.permission.code as PermissionCode;
        const grants = resolved.get(code) ?? [];
        grants.push({
          roleCode: assignment.schoolRole.code,
          scope: rolePermission.scopeMode,
          departmentIds,
        });
        resolved.set(code, grants);
      }
    }

    return resolved;
  }

  async hasEveryPermission(userId: string, permissions: readonly PermissionCode[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    const resolved = await this.resolve(userId);
    return permissions.every((permission) => resolved.has(permission));
  }

  async hasAnyPermission(userId: string, permissions: readonly PermissionCode[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    const resolved = await this.resolve(userId);
    return permissions.some((permission) => resolved.has(permission));
  }

  async permitsDepartment(
    userId: string,
    permission: PermissionCode,
    departmentId: string,
  ): Promise<boolean> {
    const grants = (await this.resolve(userId)).get(permission) ?? [];
    return grants.some(
      (grant) =>
        grant.scope === PermissionScopeMode.SCHOOL ||
        (grant.scope === PermissionScopeMode.DEPARTMENT &&
          grant.departmentIds.includes(departmentId)),
    );
  }
}

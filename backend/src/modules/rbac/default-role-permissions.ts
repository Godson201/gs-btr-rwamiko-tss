import { PermissionCode, getPermissionDefinition } from './permission.catalog';
import { SchoolRoleCode } from './school-role.catalog';

export type PermissionScopeMode =
  | 'SCHOOL'
  | 'SELF'
  | 'TEACHING_ASSIGNMENT'
  | 'CLASS_MASTER'
  | 'DEPARTMENT';

export interface DefaultRolePermissionGrant {
  role: SchoolRoleCode;
  permission: PermissionCode;
  scope: PermissionScopeMode;
}

/**
 * Conservative initial grants for capabilities backed by existing APIs.
 * This matrix is data for the later migration and guard phases; importing it
 * does not authorize a request. PLANNED permissions are intentionally absent.
 */
export const DEFAULT_ROLE_PERMISSION_GRANTS = [
  { role: 'SYSTEM_ADMIN', permission: 'users.view', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'users.create', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'users.update', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'users.deactivate', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'users.assign_role', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'users.remove_role', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'system.audit.view', scope: 'SCHOOL' },
  // Preserve the legacy administrator's read-only academic visibility without
  // making technical administrators academic decision-makers.
  { role: 'SYSTEM_ADMIN', permission: 'academic.view', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'academic.curriculum.view', scope: 'SCHOOL' },
  { role: 'SYSTEM_ADMIN', permission: 'department.view', scope: 'SCHOOL' },

  { role: 'HEAD_TEACHER', permission: 'users.view', scope: 'SCHOOL' },
  { role: 'HEAD_TEACHER', permission: 'academic.view', scope: 'SCHOOL' },
  { role: 'HEAD_TEACHER', permission: 'academic.curriculum.view', scope: 'SCHOOL' },
  { role: 'HEAD_TEACHER', permission: 'teaching.assignment.view', scope: 'SCHOOL' },
  { role: 'HEAD_TEACHER', permission: 'department.view', scope: 'SCHOOL' },

  { role: 'DOS', permission: 'academic.view', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'academic.manage', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'academic.curriculum.view', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'academic.curriculum.manage', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'teaching.assignment.view', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'teaching.assignment.manage', scope: 'SCHOOL' },
  { role: 'DOS', permission: 'department.view', scope: 'SCHOOL' },

  { role: 'HOD', permission: 'academic.view', scope: 'DEPARTMENT' },
  { role: 'HOD', permission: 'academic.curriculum.view', scope: 'DEPARTMENT' },
  { role: 'HOD', permission: 'teaching.assignment.view', scope: 'DEPARTMENT' },
  { role: 'HOD', permission: 'department.view', scope: 'DEPARTMENT' },

  { role: 'TEACHER', permission: 'academic.view', scope: 'TEACHING_ASSIGNMENT' },
  { role: 'TEACHER', permission: 'academic.curriculum.view', scope: 'TEACHING_ASSIGNMENT' },
  { role: 'TEACHER', permission: 'teaching.assignment.view', scope: 'SELF' },
] as const satisfies readonly DefaultRolePermissionGrant[];

export function assertDefaultGrantIsImplemented(grant: DefaultRolePermissionGrant): void {
  const definition = getPermissionDefinition(grant.permission);
  if (definition.implementation !== 'IMPLEMENTED') {
    throw new Error(`Default grant references planned permission: ${grant.permission}`);
  }
}

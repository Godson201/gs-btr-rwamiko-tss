import 'reflect-metadata';
import { PERMISSIONS_KEY, RequiredPermissions } from '../src/decorators/permissions.decorator';
import { ROLES_KEY } from '../src/decorators/roles.decorator';
import { AcademicYearsController } from '../src/modules/academic-years/academic-years.controller';
import { AuditController } from '../src/modules/audit/audit.controller';
import { ClassesController } from '../src/modules/classes/classes.controller';
import { ClassModulesController } from '../src/modules/class-modules/class-modules.controller';
import { DepartmentsController } from '../src/modules/departments/departments.controller';
import { ModulesController } from '../src/modules/modules/modules.controller';
import { RbacController } from '../src/modules/rbac/rbac.controller';

function assertPermission(target: object, expected: string): void {
  const requirement = Reflect.getMetadata(PERMISSIONS_KEY, target) as
    | RequiredPermissions
    | undefined;
  if (
    requirement?.match !== 'ALL' ||
    requirement.permissions.length !== 1 ||
    requirement.permissions[0] !== expected
  ) {
    throw new Error(`Expected ${expected} permission metadata`);
  }
}

assertPermission(AcademicYearsController, 'academic.view');
assertPermission(AuditController, 'system.audit.view');
assertPermission(DepartmentsController, 'department.view');
assertPermission(ClassesController.prototype.findAll, 'academic.view');
assertPermission(ClassesController.prototype.findOne, 'academic.view');
assertPermission(ClassModulesController.prototype.findAll, 'academic.curriculum.view');
assertPermission(ModulesController.prototype.findAll, 'academic.curriculum.view');
assertPermission(ModulesController.prototype.findOne, 'academic.curriculum.view');
assertPermission(RbacController.prototype.listRoles, 'users.view');
assertPermission(RbacController.prototype.getUserRoles, 'users.view');
assertPermission(RbacController.prototype.assign, 'users.assign_role');
assertPermission(RbacController.prototype.remove, 'users.remove_role');

const myAccessRoles = Reflect.getMetadata(ROLES_KEY, RbacController.prototype.myAccess) as unknown[];
if (!Array.isArray(myAccessRoles) || myAccessRoles.length !== 0) {
  throw new Error('The current-user access endpoint must be available to every authenticated portal role');
}

if (Reflect.getMetadata(PERMISSIONS_KEY, ClassesController.prototype.create)) {
  throw new Error('Unmigrated mutation routes must retain legacy authorization only');
}

console.log('Initial permission-protected route metadata checks passed.');

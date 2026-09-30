import 'reflect-metadata';
import { PERMISSIONS_KEY, RequiredPermissions } from '../src/decorators/permissions.decorator';
import { AcademicYearsController } from '../src/modules/academic-years/academic-years.controller';
import { ClassesController } from '../src/modules/classes/classes.controller';
import { ClassModulesController } from '../src/modules/class-modules/class-modules.controller';
import { DepartmentsController } from '../src/modules/departments/departments.controller';
import { ModulesController } from '../src/modules/modules/modules.controller';

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
assertPermission(DepartmentsController, 'department.view');
assertPermission(ClassesController.prototype.findAll, 'academic.view');
assertPermission(ClassesController.prototype.findOne, 'academic.view');
assertPermission(ClassModulesController.prototype.findAll, 'academic.curriculum.view');
assertPermission(ModulesController.prototype.findAll, 'academic.curriculum.view');
assertPermission(ModulesController.prototype.findOne, 'academic.curriculum.view');

if (Reflect.getMetadata(PERMISSIONS_KEY, ClassesController.prototype.create)) {
  throw new Error('Unmigrated mutation routes must retain legacy authorization only');
}

console.log('Initial permission-protected route metadata checks passed.');

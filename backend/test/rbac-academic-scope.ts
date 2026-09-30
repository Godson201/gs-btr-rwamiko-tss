import { PermissionScopeMode } from '@prisma/client';
import { AcademicScopeService } from '../src/modules/rbac/academic-scope.service';
import { PermissionAccessService } from '../src/modules/rbac/permission-access.service';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function accessWith(scope: PermissionScopeMode, departmentIds: string[] = []) {
  return {
    resolve: async () => new Map([
      ['academic.view', [{ roleCode: 'TEST', scope, departmentIds }]],
      ['academic.curriculum.view', [{ roleCode: 'TEST', scope, departmentIds }]],
      ['department.view', [{ roleCode: 'TEST', scope, departmentIds }]],
    ]),
  } as unknown as PermissionAccessService;
}

async function main() {
  const school = new AcademicScopeService(accessWith(PermissionScopeMode.SCHOOL));
  assert(JSON.stringify(await school.classWhere('user', 'academic.view')) === '{}', 'School scope must be unrestricted');

  const department = new AcademicScopeService(
    accessWith(PermissionScopeMode.DEPARTMENT, ['CSA']),
  );
  const departmentSubject = JSON.stringify(
    await department.subjectWhere('hod', 'academic.curriculum.view'),
  );
  assert(departmentSubject.includes('CSA'), 'HOD scope must contain assigned department IDs');

  const teacher = new AcademicScopeService(
    accessWith(PermissionScopeMode.TEACHING_ASSIGNMENT),
  );
  const teacherClass = JSON.stringify(await teacher.classWhere('teacher-user', 'academic.view'));
  const teacherSubject = JSON.stringify(
    await teacher.subjectWhere('teacher-user', 'academic.curriculum.view'),
  );
  assert(teacherClass.includes('teacher-user'), 'Class scope must bind the authenticated teacher');
  assert(teacherSubject.includes('teacher-user'), 'Module scope must bind the authenticated teacher');

  const denied = new AcademicScopeService({
    resolve: async () => new Map(),
  } as unknown as PermissionAccessService);
  assert(
    JSON.stringify(await denied.classWhere('user', 'academic.view')).includes('__rbac_no_access__'),
    'Missing grants must produce a deny-all query',
  );

  console.log('RBAC academic resource-scope checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

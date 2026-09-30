export type PermissionImplementation = 'IMPLEMENTED' | 'PLANNED';
export type PermissionDomain =
  | 'USERS'
  | 'ACADEMIC'
  | 'TIMETABLE'
  | 'TEACHING'
  | 'ASSESSMENT'
  | 'ATTENDANCE'
  | 'DISCIPLINE'
  | 'BOARDING'
  | 'DEPARTMENT'
  | 'REPORTS'
  | 'INVENTORY'
  | 'LIBRARY'
  | 'FINANCE'
  | 'SYSTEM';

const permission = <Code extends string>(
  code: Code,
  domain: PermissionDomain,
  description: string,
  implementation: PermissionImplementation,
) => ({ code, domain, description, implementation } as const);

/**
 * Stable permission names. IMPLEMENTED means a corresponding backend capability
 * exists today; it does not mean the capability already uses the new RBAC guard.
 * PLANNED permissions must never be seeded as active grants until their backend
 * workflow and scope checks exist.
 */
export const PERMISSION_DEFINITIONS = [
  permission('users.view', 'USERS', 'View user and staff account information.', 'IMPLEMENTED'),
  permission('users.create', 'USERS', 'Create user and staff accounts.', 'IMPLEMENTED'),
  permission('users.update', 'USERS', 'Update authorized user and staff records.', 'IMPLEMENTED'),
  permission('users.deactivate', 'USERS', 'Activate or deactivate authorized accounts.', 'IMPLEMENTED'),
  permission('users.assign_role', 'USERS', 'Assign authorized portal or school roles.', 'IMPLEMENTED'),
  permission('users.remove_role', 'USERS', 'Remove authorized school-role assignments.', 'PLANNED'),

  permission('academic.view', 'ACADEMIC', 'View authorized academic structures.', 'IMPLEMENTED'),
  permission('academic.manage', 'ACADEMIC', 'Manage authorized classes and modules.', 'IMPLEMENTED'),
  permission('academic.calendar.manage', 'ACADEMIC', 'Manage academic years, terms and calendar dates.', 'PLANNED'),
  permission('academic.curriculum.view', 'ACADEMIC', 'View authorized curriculum and module information.', 'IMPLEMENTED'),
  permission('academic.curriculum.manage', 'ACADEMIC', 'Manage authorized curriculum and module information.', 'IMPLEMENTED'),

  permission('timetable.view', 'TIMETABLE', 'View an authorized timetable.', 'PLANNED'),
  permission('timetable.manage', 'TIMETABLE', 'Create and update authorized timetable entries.', 'PLANNED'),
  permission('timetable.publish', 'TIMETABLE', 'Publish an approved timetable.', 'PLANNED'),

  permission('teaching.assignment.view', 'TEACHING', 'View authorized teaching allocations.', 'IMPLEMENTED'),
  permission('teaching.assignment.manage', 'TEACHING', 'Manage class and module teaching allocations.', 'IMPLEMENTED'),
  permission('lesson_plan.create', 'TEACHING', 'Create lesson plans for authorized allocations.', 'PLANNED'),
  permission('lesson_plan.review', 'TEACHING', 'Review lesson plans within authorized scope.', 'PLANNED'),
  permission('scheme_of_work.create', 'TEACHING', 'Create schemes of work for authorized allocations.', 'PLANNED'),
  permission('scheme_of_work.review', 'TEACHING', 'Review schemes of work within authorized scope.', 'PLANNED'),

  permission('marks.enter', 'ASSESSMENT', 'Enter marks for authorized assessments.', 'PLANNED'),
  permission('marks.edit_own', 'ASSESSMENT', 'Edit marks owned by the teacher while the workflow permits.', 'PLANNED'),
  permission('marks.view', 'ASSESSMENT', 'View marks within authorized scope.', 'PLANNED'),
  permission('marks.verify', 'ASSESSMENT', 'Verify submitted marks within authorized scope.', 'PLANNED'),
  permission('marks.approve', 'ASSESSMENT', 'Approve verified marks through an approval workflow.', 'PLANNED'),
  permission('marks.publish', 'ASSESSMENT', 'Publish approved results.', 'PLANNED'),
  permission('assessment.create', 'ASSESSMENT', 'Create assessments for authorized teaching allocations.', 'PLANNED'),
  permission('assessment.manage', 'ASSESSMENT', 'Manage assessments within authorized scope.', 'PLANNED'),
  permission('examination.schedule', 'ASSESSMENT', 'Schedule examinations within authorized scope.', 'PLANNED'),
  permission('examination.manage', 'ASSESSMENT', 'Manage examination workflows within authorized scope.', 'PLANNED'),

  permission('attendance.record', 'ATTENDANCE', 'Record attendance for authorized learners.', 'PLANNED'),
  permission('attendance.view_own_class', 'ATTENDANCE', 'View attendance for assigned classes.', 'PLANNED'),
  permission('attendance.view_all', 'ATTENDANCE', 'View school-wide attendance information.', 'PLANNED'),
  permission('attendance.manage', 'ATTENDANCE', 'Correct and administer attendance records.', 'PLANNED'),

  permission('discipline.create_case', 'DISCIPLINE', 'Create a learner discipline case.', 'PLANNED'),
  permission('discipline.view', 'DISCIPLINE', 'View discipline information within authorized scope.', 'PLANNED'),
  permission('discipline.manage', 'DISCIPLINE', 'Manage discipline cases within authorized scope.', 'PLANNED'),
  permission('discipline.issue_warning', 'DISCIPLINE', 'Issue a documented warning.', 'PLANNED'),
  permission('discipline.recommend_sanction', 'DISCIPLINE', 'Recommend a sanction for approval.', 'PLANNED'),
  permission('discipline.approve_sanction', 'DISCIPLINE', 'Approve a recommended sanction.', 'PLANNED'),
  permission('discipline.report', 'DISCIPLINE', 'Generate authorized discipline reports.', 'PLANNED'),

  permission('boarding.view', 'BOARDING', 'View authorized boarding information.', 'PLANNED'),
  permission('boarding.manage', 'BOARDING', 'Manage authorized boarding resources.', 'PLANNED'),
  permission('boarding.rollcall', 'BOARDING', 'Record boarding roll calls.', 'PLANNED'),
  permission('boarding.permission.manage', 'BOARDING', 'Manage student boarding permissions.', 'PLANNED'),
  permission('boarding.welfare.record', 'BOARDING', 'Record authorized learner welfare information.', 'PLANNED'),
  permission('boarding.report', 'BOARDING', 'Generate authorized boarding reports.', 'PLANNED'),

  permission('department.view', 'DEPARTMENT', 'View authorized department information.', 'IMPLEMENTED'),
  permission('department.manage', 'DEPARTMENT', 'Manage an explicitly assigned department.', 'PLANNED'),
  permission('department.staff.manage', 'DEPARTMENT', 'Manage staff within an explicitly assigned department.', 'PLANNED'),
  permission('department.report', 'DEPARTMENT', 'Generate reports for an explicitly assigned department.', 'PLANNED'),

  permission('reports.academic', 'REPORTS', 'Generate authorized academic reports.', 'PLANNED'),
  permission('reports.discipline', 'REPORTS', 'Generate authorized discipline reports.', 'PLANNED'),
  permission('reports.attendance', 'REPORTS', 'Generate authorized attendance reports.', 'PLANNED'),
  permission('reports.department', 'REPORTS', 'Generate authorized department reports.', 'PLANNED'),
  permission('reports.boarding', 'REPORTS', 'Generate authorized boarding reports.', 'PLANNED'),
  permission('reports.school', 'REPORTS', 'Generate authorized school-wide reports.', 'PLANNED'),

  permission('inventory.view', 'INVENTORY', 'View authorized inventory records.', 'PLANNED'),
  permission('inventory.issue', 'INVENTORY', 'Issue inventory within authorized scope.', 'PLANNED'),
  permission('inventory.receive', 'INVENTORY', 'Receive inventory within authorized scope.', 'PLANNED'),
  permission('inventory.manage', 'INVENTORY', 'Manage authorized inventory records.', 'PLANNED'),
  permission('library.view', 'LIBRARY', 'View library records.', 'PLANNED'),
  permission('library.issue', 'LIBRARY', 'Issue library resources.', 'PLANNED'),
  permission('library.return', 'LIBRARY', 'Record returned library resources.', 'PLANNED'),
  permission('library.manage', 'LIBRARY', 'Manage library resources and circulation.', 'PLANNED'),
  permission('finance.view', 'FINANCE', 'View authorized financial information.', 'PLANNED'),
  permission('finance.manage', 'FINANCE', 'Manage authorized financial information.', 'PLANNED'),
  permission('finance.report', 'FINANCE', 'Generate authorized financial reports.', 'PLANNED'),

  permission('system.settings', 'SYSTEM', 'Manage approved system configuration.', 'PLANNED'),
  permission('system.audit.view', 'SYSTEM', 'View the system activity audit trail.', 'IMPLEMENTED'),
  permission('system.roles.manage', 'SYSTEM', 'Manage school-role definitions and mappings.', 'PLANNED'),
] as const;

export type PermissionCode = (typeof PERMISSION_DEFINITIONS)[number]['code'];

export function getPermissionDefinition(code: PermissionCode) {
  const definition = PERMISSION_DEFINITIONS.find((item) => item.code === code);
  if (!definition) throw new Error(`Unknown permission: ${code}`);
  return definition;
}

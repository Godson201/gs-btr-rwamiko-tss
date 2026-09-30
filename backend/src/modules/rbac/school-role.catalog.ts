/**
 * School-management responsibilities are deliberately separate from Prisma's
 * legacy Role enum, which continues to represent application portal access.
 * This catalogue has no authorization effect until the later RBAC persistence
 * and enforcement phases are implemented.
 */
export const CORE_SCHOOL_ROLE_CODES = [
  'SYSTEM_ADMIN',
  'HEAD_TEACHER',
  'DOS',
  'DOD',
  'HOD',
  'TEACHER',
  'CLASS_TEACHER',
  'PATRON',
  'MATRON',
] as const;

export const EXTENDED_SCHOOL_ROLE_CODES = [
  'DEPUTY_HEAD_TEACHER',
  'EXAMINATION_OFFICER',
  'GUIDANCE_COUNSELLOR',
  'INTERNSHIP_COORDINATOR',
  'WORKSHOP_TECHNICIAN',
  'LAB_TECHNICIAN',
  'STOREKEEPER',
  'LIBRARIAN',
  'ACCOUNTANT',
  'BURSAR',
  'REGISTRAR',
  'SECRETARY',
  'INNOVATION_HUB_COORDINATOR',
] as const;

export const SCHOOL_ROLE_CODES = [
  ...CORE_SCHOOL_ROLE_CODES,
  ...EXTENDED_SCHOOL_ROLE_CODES,
] as const;

export type SchoolRoleCode = (typeof SCHOOL_ROLE_CODES)[number];
export type SchoolRoleStage = 'CORE' | 'DEFERRED';
export type SchoolRoleProfileRequirement =
  | 'ADMIN_PROFILE'
  | 'TEACHER_PROFILE'
  | 'FUTURE_STAFF_PROFILE';

export interface SchoolRoleDefinition {
  code: SchoolRoleCode;
  label: string;
  description: string;
  stage: SchoolRoleStage;
  profileRequirement: SchoolRoleProfileRequirement;
}

export const SCHOOL_ROLE_DEFINITIONS = [
  {
    code: 'SYSTEM_ADMIN',
    label: 'System Administrator',
    description: 'Technical user, role, configuration and audit administration.',
    stage: 'CORE',
    profileRequirement: 'ADMIN_PROFILE',
  },
  {
    code: 'HEAD_TEACHER',
    label: 'Head Teacher',
    description: 'School-wide leadership, reviewed oversight and approval responsibilities.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'DOS',
    label: 'Director of Studies',
    description: 'School-wide academic planning, monitoring and approved result workflows.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'DOD',
    label: 'Director of Discipline',
    description: 'Attendance, discipline and learner-conduct oversight.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'HOD',
    label: 'Head of Department',
    description: 'Academic and staff oversight within explicitly assigned departments.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'TEACHER',
    label: 'Teacher / Trainer',
    description: 'Teaching responsibilities within assigned classes and modules.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'CLASS_TEACHER',
    label: 'Class Teacher',
    description: 'Learner oversight within classes where the teacher is class master.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'PATRON',
    label: 'Patron',
    description: 'Boarding and learner-welfare responsibility within future assigned scope.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'MATRON',
    label: 'Matron',
    description: 'Boarding and learner-welfare responsibility within future assigned scope.',
    stage: 'CORE',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'DEPUTY_HEAD_TEACHER',
    label: 'Deputy Head Teacher',
    description: 'Delegated school leadership responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'EXAMINATION_OFFICER',
    label: 'Examination Officer',
    description: 'Examination scheduling, administration and controlled result workflows.',
    stage: 'DEFERRED',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'GUIDANCE_COUNSELLOR',
    label: 'Guidance Counsellor',
    description: 'Authorized learner guidance and counselling responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'INTERNSHIP_COORDINATOR',
    label: 'Internship Coordinator',
    description: 'Industrial attachment and workplace-learning coordination.',
    stage: 'DEFERRED',
    profileRequirement: 'TEACHER_PROFILE',
  },
  {
    code: 'WORKSHOP_TECHNICIAN',
    label: 'Workshop Technician',
    description: 'Workshop operations and equipment support.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'LAB_TECHNICIAN',
    label: 'Laboratory Technician',
    description: 'Laboratory operations and equipment support.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'STOREKEEPER',
    label: 'Storekeeper',
    description: 'Authorized stock custody, receipt and issue responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'LIBRARIAN',
    label: 'Librarian',
    description: 'Library circulation and resource-management responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'Authorized accounting and financial-record responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'BURSAR',
    label: 'Bursar',
    description: 'Authorized school finance and revenue-management responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'REGISTRAR',
    label: 'Registrar',
    description: 'Authorized learner registration and official-record responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'SECRETARY',
    label: 'Secretary',
    description: 'Authorized administrative correspondence and office responsibilities.',
    stage: 'DEFERRED',
    profileRequirement: 'FUTURE_STAFF_PROFILE',
  },
  {
    code: 'INNOVATION_HUB_COORDINATOR',
    label: 'Innovation Hub Coordinator',
    description: 'Innovation hub, project and entrepreneurship coordination.',
    stage: 'DEFERRED',
    profileRequirement: 'TEACHER_PROFILE',
  },
] as const satisfies readonly SchoolRoleDefinition[];

export const LEGACY_STAFF_TITLE_ROLE_MAP = {
  HEAD_TEACHER: 'HEAD_TEACHER',
  DIRECTOR_OF_STUDIES: 'DOS',
  DIRECTOR_OF_DISCIPLINE: 'DOD',
  PATRON: 'PATRON',
  MATRON: 'MATRON',
} as const satisfies Record<string, SchoolRoleCode>;

export const LEGACY_PORTAL_ROLE_MAP = {
  TEACHER: 'TEACHER',
  ADMIN: 'SYSTEM_ADMIN',
  SUPER_ADMIN: 'SYSTEM_ADMIN',
} as const satisfies Record<string, SchoolRoleCode>;

export function getSchoolRoleDefinition(code: SchoolRoleCode): SchoolRoleDefinition {
  const definition = SCHOOL_ROLE_DEFINITIONS.find((role) => role.code === code);
  if (!definition) {
    throw new Error(`Unknown school role: ${code}`);
  }
  return definition;
}

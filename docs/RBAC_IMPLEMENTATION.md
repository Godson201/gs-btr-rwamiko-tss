# School RBAC implementation

This document describes the role-based access control implementation currently present in the application. It is operational documentation, not a proposal. The earlier `RBAC_DESIGN.md` remains the historical design record.

## Preserved account workflow

RBAC extends the existing authentication system. It does not replace it.

- Administrators still create teacher and staff accounts through the existing workflow.
- Invitation email, password creation, login, logout, password reset and account activation are unchanged.
- `User.role` and `User.portalAccess` remain the authoritative legacy portal selectors.
- `Teacher.staffTitle` remains available for backward compatibility.
- A staff member changes primary responsibility on the same account; a second account is not required.
- Parent and student profiles remain separate from school staff responsibilities.

Portal access and school responsibility are intentionally different concepts. A Head Teacher, DoS, DoD, HoD, Patron or Matron retains the `TEACHER` portal as the staff application shell, while the active school responsibility selects the dashboard and authorization policy.

## Data model

The additive RBAC models are:

| Model | Purpose |
| --- | --- |
| `SchoolRole` | Stable school responsibility code, display label and active status |
| `Permission` | Stable action code and active status |
| `SchoolRolePermission` | Permission granted to a role with a scope mode |
| `UserSchoolRole` | Active or historical role assignment for one user |
| `UserSchoolRoleDepartment` | Explicit department scope for an assigned role, currently HoD |

One user can have historical `UserSchoolRole` records. The unique user/role constraint prevents duplicates, while an inactive assignment can be reactivated safely. The service enforces one active primary staff responsibility among Teacher, Head Teacher, DoS, DoD, HoD, Patron and Matron.

Supported scope modes are:

- `SCHOOL`: all resources supported by the permission.
- `SELF`: only the authenticated user's own records.
- `TEACHING_ASSIGNMENT`: classes and modules assigned through the existing teaching-allocation relationship.
- `CLASS_MASTER`: classes assigned through the existing class-teacher relationship; reserved for the corresponding backend workflow.
- `DEPARTMENT`: only explicitly assigned department IDs.

## Roles

The active core catalogue contains:

| Code | Meaning | Required profile |
| --- | --- | --- |
| `SYSTEM_ADMIN` | Technical users, roles and audit administration | Administrator |
| `HEAD_TEACHER` | School leadership and oversight | Teacher |
| `DOS` | Director of Studies | Teacher |
| `DOD` | Director of Discipline | Teacher |
| `HOD` | Head of Department | Teacher and at least one department scope |
| `TEACHER` | Teacher or trainer | Teacher |
| `CLASS_TEACHER` | Assigned-class responsibility | Teacher |
| `PATRON` | Boarding and learner welfare responsibility | Teacher |
| `MATRON` | Boarding and learner welfare responsibility | Teacher |

The catalogue also defines deferred roles for future modules: Deputy Head Teacher, Examination Officer, Guidance Counsellor, Internship Coordinator, Workshop Technician, Lab Technician, Storekeeper, Librarian, Accountant, Bursar, Registrar, Secretary and Innovation Hub Coordinator. Roles requiring a future staff profile cannot currently be assigned.

## Enforced default permission matrix

Only implemented permissions are seeded as active grants. Scope is shown in parentheses.

| Role | Active permission grants |
| --- | --- |
| `SYSTEM_ADMIN` | `users.view`, `users.create`, `users.update`, `users.deactivate`, `users.assign_role`, `users.remove_role`, `system.audit.view`, `academic.view`, `academic.curriculum.view`, `department.view` (`SCHOOL`) |
| `HEAD_TEACHER` | `users.view`, `academic.view`, `academic.curriculum.view`, `teaching.assignment.view`, `department.view` (`SCHOOL`) |
| `DOS` | `academic.view`, `academic.manage`, `academic.curriculum.view`, `academic.curriculum.manage`, `teaching.assignment.view`, `teaching.assignment.manage`, `department.view` (`SCHOOL`) |
| `HOD` | `academic.view`, `academic.curriculum.view`, `teaching.assignment.view`, `department.view` (`DEPARTMENT`) |
| `TEACHER` | `academic.view`, `academic.curriculum.view`, `department.view` (`TEACHING_ASSIGNMENT`); `teaching.assignment.view` (`SELF`) |
| `DOD` | No active grants until discipline and attendance persistence is implemented |
| `CLASS_TEACHER` | No active grants until class-teacher workflows are protected end to end |
| `PATRON` / `MATRON` | No active grants until boarding scope and persistence are implemented |
| Deferred roles | No active grants |

This matrix is conservative by design. `SYSTEM_ADMIN` has technical administration and read-only academic visibility but does not receive academic-management permissions from RBAC. `DOS` has academic permissions but no user-role or audit permission. Planned permissions never authorize a request.

The permission catalogue includes future assessment, marks, examinations, attendance, discipline, boarding, reports, inventory, library, finance and system-settings permissions. They remain inactive until their backend workflow, persistence, scope checks and tests exist.

## Authorization flow

For a protected request the backend:

1. Validates the existing JWT.
2. Reloads the current user and rejects a missing or inactive account with HTTP 401.
3. Applies the existing portal-role guard where the route still uses legacy portal eligibility.
4. Loads active user-role assignments, active roles, active permissions and department scopes.
5. Requires the declared permission; missing permission returns HTTP 403.
6. Applies resource scope in the database query for converted academic reads.

An empty grant set always denies access. The frontend permission list is only a navigation and display hint; backend guards and scoped queries remain authoritative.

Currently converted permission-protected areas include:

- Academic years
- Classes and individual class reads
- Departments
- Modules and individual module reads
- Class-module reads
- Audit logs
- School-role listing, assignment and removal

Existing mutation routes that have not yet been converted retain their previous portal-role policy. This preserves existing behavior while new workflows are migrated incrementally.

## Role administration

An authorized administrator opens the existing Teachers page, selects a staff member and chooses one primary responsibility. Selecting another responsibility deactivates the previous primary responsibility in the same transaction, updates the legacy staff title where applicable and sends the staff member an email.

Rules enforced by the backend:

- Users cannot assign or remove their own roles.
- A teacher profile is required for teacher-based responsibilities.
- An administrator profile is required for `SYSTEM_ADMIN`.
- HoD requires at least one valid department ID.
- Department scope is rejected for roles other than HoD.
- `TEACHER` cannot be removed while the teacher profile exists.
- Unsupported future staff roles are rejected.
- Primary responsibility assignments are switched transactionally rather than combined.
- The staff member retains the Teacher portal login while receiving a responsibility-specific dashboard.
- Email failure is reported to the administrator without reversing a completed responsibility change.

Additive endpoints:

| Method and path | Required permission | Purpose |
| --- | --- | --- |
| `GET /api/rbac/me/access` | Authenticated user | Effective permissions and active role assignments for the current user |
| `GET /api/rbac/roles` | `users.view` | Available active role definitions |
| `GET /api/rbac/users/:userId/roles` | `users.view` | Current active roles for a user |
| `POST /api/rbac/users/:userId/roles` | `users.assign_role` | Assign or reactivate one role; accepts `roleCode` and optional `departmentIds` |
| `DELETE /api/rbac/users/:userId/roles/:roleCode` | `users.remove_role` | Deactivate one role assignment |

## Navigation and dashboards

The shared portal layout supports `requiredPermission` on menu items. The authentication context retrieves `/rbac/me/access`, and desktop and mobile menus use the same filtered configuration. Hiding a menu never replaces backend authorization.

The staff dashboard selects one responsibility-specific workspace for Teacher, Head Teacher, DoS, DoD, HoD, Patron or Matron. Navigation is filtered to that responsibility. HoD displays assigned department scope. Implemented capabilities link to existing pages; planned workflows are shown as pending rather than as unsecured controls.

## Audit logging

Global request auditing remains in place. Sensitive RBAC operations add semantic actions:

- `ROLE_ASSIGNED`
- `ROLE_REMOVED`
- `ACCOUNT_ACTIVATED`
- `ACCOUNT_DEACTIVATED`

Entries include the actor, target, timestamp, outcome and allow-listed metadata such as role code and department IDs. Audit metadata never records request bodies, passwords, reset tokens, JWTs, cookies or arbitrary values. An audit storage failure is reported without changing the result of an already completed operation.

## Migration and seeding

The RBAC migration is additive. It does not drop or rename legacy role fields. Never reset a production database and never edit an already-applied migration.

Normal deployment order:

```sh
cd backend
npx prisma migrate deploy
npm run seed
```

The seed uses upserts and can run repeatedly. It ensures the role catalogue, permission catalogue, default grants and legacy assignments without resetting existing passwords. Password reset through the seed remains controlled by the existing explicit environment flag and is unrelated to RBAC migration.

Legacy mappings are preserved as follows:

| Existing data | School-role assignment |
| --- | --- |
| `ADMIN` or `SUPER_ADMIN` portal access | `SYSTEM_ADMIN` |
| Teacher profile or `TEACHER` access | `TEACHER` |
| Head Teacher staff title | `HEAD_TEACHER` |
| Director of Studies staff title | `DOS` |
| Director of Discipline staff title | `DOD` |
| Patron or Matron staff title | Matching role |
| Existing class-master assignment | `CLASS_TEACHER` |

## Rollback

Application commits can be rolled back in reverse dependency order: dashboards and navigation, administrator UI, APIs and guards, then seeding logic. Do not reverse or delete an RBAC migration after it has run in production. The additive RBAC tables can remain unused while an earlier compatible application build operates through legacy fields.

## Adding a future role or permission

1. Implement the backend data model and workflow first.
2. Define authoritative ownership and resource scope.
3. Add the permission to `permission.catalog.ts` as `PLANNED` while development is incomplete.
4. Protect controllers with `PermissionsGuard` and `RequirePermissions`.
5. Apply scope inside service database queries, including lists, counts and mutations.
6. Add denial, cross-scope and inactive-account tests.
7. Change the permission to `IMPLEMENTED` and add a conservative default grant.
8. Add or activate the school-role definition when its required profile exists.
9. Run the seed to synchronize definitions through upserts.
10. Add permission-aware navigation and dashboard widgets only after backend enforcement passes.
11. Extend semantic audit logging for sensitive actions.
12. Update this matrix to match the shipped implementation.

Do not add authority by checking a role string throughout business code, granting a wildcard, trusting frontend state or inferring HoD scope from ordinary department membership.

## Verification

Relevant checks can be run with:

```sh
cd backend
npm run build
npx prisma validate
npx ts-node test/rbac-role-catalog.ts
npx ts-node test/rbac-permission-catalog.ts
npx ts-node test/rbac-permissions-guard.ts
npx ts-node test/rbac-permission-access.ts
npx ts-node test/rbac-academic-scope.ts
npx ts-node test/rbac-role-assignment.ts
npx ts-node test/rbac-security.ts
npm run test:audit
npm run test:public-updates
npm run test:message-media

cd ../frontend
npm run lint
npm run build
npm run test:pwa
npm run test:login
```

The migration chain must additionally be rehearsed with `prisma migrate deploy` and repeated seeding on an isolated PostgreSQL database before production rollout.

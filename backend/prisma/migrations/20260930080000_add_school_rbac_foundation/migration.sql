-- Additive RBAC foundation. Legacy User.role, User.portalAccess,
-- Teacher.staffTitle and all existing records remain unchanged.

CREATE TYPE "PermissionScopeMode" AS ENUM (
  'SCHOOL',
  'SELF',
  'TEACHING_ASSIGNMENT',
  'CLASS_MASTER',
  'DEPARTMENT'
);

CREATE TYPE "SchoolRoleAssignmentSource" AS ENUM (
  'MANUAL',
  'LEGACY_STAFF_TITLE',
  'LEGACY_PORTAL_ROLE',
  'LEGACY_CLASS_MASTER'
);

CREATE TABLE "SchoolRole" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SchoolRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolRolePermission" (
  "schoolRoleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "scopeMode" "PermissionScopeMode" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SchoolRolePermission_pkey" PRIMARY KEY ("schoolRoleId", "permissionId")
);

CREATE TABLE "UserSchoolRole" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "schoolRoleId" TEXT NOT NULL,
  "assignedById" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" "SchoolRoleAssignmentSource" NOT NULL DEFAULT 'MANUAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSchoolRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSchoolRoleDepartment" (
  "userSchoolRoleId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserSchoolRoleDepartment_pkey" PRIMARY KEY ("userSchoolRoleId", "departmentId")
);

CREATE UNIQUE INDEX "SchoolRole_code_key" ON "SchoolRole"("code");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE INDEX "SchoolRolePermission_permissionId_idx" ON "SchoolRolePermission"("permissionId");
CREATE UNIQUE INDEX "UserSchoolRole_userId_schoolRoleId_key" ON "UserSchoolRole"("userId", "schoolRoleId");
CREATE INDEX "UserSchoolRole_schoolRoleId_idx" ON "UserSchoolRole"("schoolRoleId");
CREATE INDEX "UserSchoolRole_assignedById_idx" ON "UserSchoolRole"("assignedById");
CREATE INDEX "UserSchoolRoleDepartment_departmentId_idx" ON "UserSchoolRoleDepartment"("departmentId");

ALTER TABLE "SchoolRolePermission"
  ADD CONSTRAINT "SchoolRolePermission_schoolRoleId_fkey"
  FOREIGN KEY ("schoolRoleId") REFERENCES "SchoolRole"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchoolRolePermission"
  ADD CONSTRAINT "SchoolRolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserSchoolRole"
  ADD CONSTRAINT "UserSchoolRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSchoolRole"
  ADD CONSTRAINT "UserSchoolRole_schoolRoleId_fkey"
  FOREIGN KEY ("schoolRoleId") REFERENCES "SchoolRole"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserSchoolRole"
  ADD CONSTRAINT "UserSchoolRole_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserSchoolRoleDepartment"
  ADD CONSTRAINT "UserSchoolRoleDepartment_userSchoolRoleId_fkey"
  FOREIGN KEY ("userSchoolRoleId") REFERENCES "UserSchoolRole"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSchoolRoleDepartment"
  ADD CONSTRAINT "UserSchoolRoleDepartment_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

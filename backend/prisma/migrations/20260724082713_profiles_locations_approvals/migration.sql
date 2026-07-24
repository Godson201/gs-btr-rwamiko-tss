-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "claimedAdmissionNo" TEXT,
ADD COLUMN     "claimedStudentName" TEXT,
ADD COLUMN     "requestedStudentId" TEXT,
ADD COLUMN     "status" "ParentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "otherSchoolName" TEXT,
ADD COLUMN     "worksAtAnotherSchool" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "portalAccess" "Role"[] DEFAULT ARRAY[]::"Role"[],
ADD COLUMN     "residenceLocationId" TEXT,
ADD COLUMN     "workplaceLocationId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "cell" TEXT NOT NULL,
    "village" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_province_district_sector_cell_idx" ON "Location"("province", "district", "sector", "cell");

-- CreateIndex
CREATE UNIQUE INDEX "Location_province_district_sector_cell_village_key" ON "Location"("province", "district", "sector", "cell", "village");

-- Backfill: every existing account keeps access to the portal that matches its current role.
UPDATE "User" SET "portalAccess" = ARRAY["role"]::"Role"[];

-- Backfill: grandfather in every existing parent so nobody currently active gets locked out
-- by the new approval workflow (only newly self-registered parents start PENDING).
UPDATE "Parent" SET "status" = 'APPROVED';

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenceLocationId_fkey" FOREIGN KEY ("residenceLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workplaceLocationId_fkey" FOREIGN KEY ("workplaceLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_requestedStudentId_fkey" FOREIGN KEY ("requestedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

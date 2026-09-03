-- CreateEnum
CREATE TYPE "AdmissionApplicantType" AS ENUM ('STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "applicantType" "AdmissionApplicantType" NOT NULL,
    "studentFirstName" TEXT NOT NULL,
    "studentLastName" TEXT NOT NULL,
    "studentDateOfBirth" TIMESTAMP(3) NOT NULL,
    "studentGender" "Gender" NOT NULL,
    "previousSchool" TEXT NOT NULL,
    "applyingLevel" TEXT NOT NULL,
    "preferredProgramme" TEXT NOT NULL,
    "guardianFirstName" TEXT NOT NULL,
    "guardianLastName" TEXT NOT NULL,
    "guardianRelationship" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "residence" TEXT NOT NULL,
    "resultDocumentUrl" TEXT NOT NULL,
    "resultDocumentName" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdmissionApplication_applicationNo_key" ON "AdmissionApplication"("applicationNo");
CREATE INDEX "AdmissionApplication_status_createdAt_idx" ON "AdmissionApplication"("status", "createdAt");
CREATE INDEX "AdmissionApplication_guardianEmail_idx" ON "AdmissionApplication"("guardianEmail");

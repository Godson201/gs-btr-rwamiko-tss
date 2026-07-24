-- CreateEnum
CREATE TYPE "StaffTitle" AS ENUM ('HEAD_TEACHER', 'DIRECTOR_OF_STUDIES', 'DIRECTOR_OF_DISCIPLINE', 'PATRON', 'MATRON');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "staffTitle" "StaffTitle";

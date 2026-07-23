-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY');

-- AlterEnum
BEGIN;
CREATE TYPE "AnnouncementType_new" AS ENUM ('GENERAL', 'ACADEMIC', 'FEES_FINANCE', 'REGISTRATION', 'EVENT_ACTIVITY', 'DISCIPLINE', 'SAFETY_ALERT', 'EMERGENCY');
ALTER TABLE "Announcement" ALTER COLUMN "type" TYPE "AnnouncementType_new" USING ("type"::text::"AnnouncementType_new");
ALTER TYPE "AnnouncementType" RENAME TO "AnnouncementType_old";
ALTER TYPE "AnnouncementType_new" RENAME TO "AnnouncementType";
DROP TYPE "public"."AnnouncementType_old";
COMMIT;

-- CreateTable
CREATE TABLE "AnnouncementAttachment" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementComment" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReaction" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementAttachment_announcementId_idx" ON "AnnouncementAttachment"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementComment_announcementId_idx" ON "AnnouncementComment"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReaction_announcementId_userId_key" ON "AnnouncementReaction"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "AnnouncementAttachment" ADD CONSTRAINT "AnnouncementAttachment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementComment" ADD CONSTRAINT "AnnouncementComment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementComment" ADD CONSTRAINT "AnnouncementComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


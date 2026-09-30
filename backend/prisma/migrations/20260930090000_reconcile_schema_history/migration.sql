-- Reconcile features already represented in schema.prisma and used by the
-- application, but missing from the historical migration chain. No records,
-- tables or business columns are removed.

ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

ALTER TABLE "AdmissionApplication"
  ALTER COLUMN "previousSchoolLocation" DROP DEFAULT,
  ALTER COLUMN "transferReason" DROP DEFAULT,
  ALTER COLUMN "averageMarks" DROP DEFAULT,
  ALTER COLUMN "profilePictureUrl" DROP DEFAULT,
  ALTER COLUMN "profilePictureName" DROP DEFAULT;

ALTER TABLE "Announcement"
  ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AnnouncementAttachment"
  ADD COLUMN "data" BYTEA,
  ADD COLUMN "mimeType" TEXT;

ALTER TABLE "AuditLog"
  ADD COLUMN "actorEmail" TEXT,
  ADD COLUMN "actorName" TEXT,
  ADD COLUMN "actorRole" TEXT,
  ADD COLUMN "method" TEXT,
  ADD COLUMN "resource" TEXT,
  ADD COLUMN "resourceId" TEXT,
  ADD COLUMN "statusCode" INTEGER,
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "MessageAttachment"
  ADD COLUMN "data" BYTEA,
  ADD COLUMN "mimeType" TEXT;

CREATE INDEX "AuditLog_createdAt_id_idx" ON "AuditLog"("createdAt", "id");
CREATE INDEX "AuditLog_resource_createdAt_idx" ON "AuditLog"("resource", "createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

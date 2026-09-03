UPDATE "AdmissionApplication" SET "notes" = '' WHERE "notes" IS NULL;
ALTER TABLE "AdmissionApplication" ALTER COLUMN "notes" SET NOT NULL;

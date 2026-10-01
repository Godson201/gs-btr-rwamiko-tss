-- Existing classes remain unassigned; newly created classes can be linked to a trade.
ALTER TABLE "Class" ADD COLUMN "departmentId" TEXT;

CREATE INDEX "Class_departmentId_idx" ON "Class"("departmentId");

ALTER TABLE "Class"
ADD CONSTRAINT "Class_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add operator_id to ServiceSchedule for session operator control
ALTER TABLE "ServiceSchedule" ADD COLUMN "operatorId" TEXT;

-- Initial operator is the creator
UPDATE "ServiceSchedule" SET "operatorId" = "createdById";

-- Add FK constraint (after setting initial values)
ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX "ServiceSchedule_operatorId_idx" ON "ServiceSchedule"("operatorId");
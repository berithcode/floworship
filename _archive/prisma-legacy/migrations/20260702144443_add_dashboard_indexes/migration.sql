-- CreateIndex
CREATE INDEX "MinistryMember_ministryId_role_idx" ON "MinistryMember"("ministryId", "role");

-- CreateIndex
CREATE INDEX "MonthlyScheduleCycle_ministryId_status_idx" ON "MonthlyScheduleCycle"("ministryId", "status");

-- CreateIndex
CREATE INDEX "ServiceAssignment_userId_status_idx" ON "ServiceAssignment"("userId", "status");

-- CreateIndex
CREATE INDEX "ServiceSchedule_ministryId_date_idx" ON "ServiceSchedule"("ministryId", "date");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_triggeredAt_idx" ON "SessionExecutionLog"("triggeredAt");

-- CreateIndex
CREATE INDEX "Song_ministryId_status_idx" ON "Song"("ministryId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_ministryId_sentAt_status_idx" ON "WhatsAppMessageLog"("ministryId", "sentAt", "status");

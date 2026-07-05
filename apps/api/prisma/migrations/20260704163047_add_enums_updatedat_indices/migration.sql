/*
  Warnings:

  - Added the required column `updatedAt` to the `AvailabilityResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceRepertoireItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WhatsAppMessageLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvailabilityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "ministryMemberId" TEXT NOT NULL,
    "sundayDate" DATETIME NOT NULL,
    "available" BOOLEAN NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AvailabilityResponse_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvailabilityResponse_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AvailabilityResponse" ("available", "cycleId", "id", "ministryMemberId", "respondedAt", "sundayDate") SELECT "available", "cycleId", "id", "ministryMemberId", "respondedAt", "sundayDate" FROM "AvailabilityResponse";
DROP TABLE "AvailabilityResponse";
ALTER TABLE "new_AvailabilityResponse" RENAME TO "AvailabilityResponse";
CREATE INDEX "AvailabilityResponse_ministryMemberId_idx" ON "AvailabilityResponse"("ministryMemberId");
CREATE UNIQUE INDEX "AvailabilityResponse_cycleId_ministryMemberId_sundayDate_key" ON "AvailabilityResponse"("cycleId", "ministryMemberId", "sundayDate");
CREATE TABLE "new_Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'musician',
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "usedByUserId" TEXT,
    "invitedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invite_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invite" ("createdAt", "email", "expiresAt", "id", "invitedById", "ministryId", "name", "phone", "role", "token", "usedAt", "usedByUserId") SELECT "createdAt", "email", "expiresAt", "id", "invitedById", "ministryId", "name", "phone", "role", "token", "usedAt", "usedByUserId" FROM "Invite";
DROP TABLE "Invite";
ALTER TABLE "new_Invite" RENAME TO "Invite";
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
CREATE INDEX "Invite_phone_idx" ON "Invite"("phone");
CREATE INDEX "Invite_ministryId_usedAt_idx" ON "Invite"("ministryId", "usedAt");
CREATE TABLE "new_PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordResetToken" ("createdAt", "expiresAt", "id", "token", "usedAt", "userId") SELECT "createdAt", "expiresAt", "id", "token", "usedAt", "userId" FROM "PasswordResetToken";
DROP TABLE "PasswordResetToken";
ALTER TABLE "new_PasswordResetToken" RENAME TO "PasswordResetToken";
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE TABLE "new_ServiceAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "ministryMemberId" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vago',
    "substitutionOf" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceAssignment_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceAssignment" ("confirmed", "confirmedAt", "id", "ministryMemberId", "role", "scheduleId", "status", "substitutionOf") SELECT "confirmed", "confirmedAt", "id", "ministryMemberId", "role", "scheduleId", "status", "substitutionOf" FROM "ServiceAssignment";
DROP TABLE "ServiceAssignment";
ALTER TABLE "new_ServiceAssignment" RENAME TO "ServiceAssignment";
CREATE INDEX "ServiceAssignment_ministryMemberId_status_idx" ON "ServiceAssignment"("ministryMemberId", "status");
CREATE INDEX "ServiceAssignment_scheduleId_status_idx" ON "ServiceAssignment"("scheduleId", "status");
CREATE INDEX "ServiceAssignment_scheduleId_role_idx" ON "ServiceAssignment"("scheduleId", "role");
CREATE TABLE "new_ServiceRepertoireItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "keyOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRepertoireItem_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceRepertoireItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRepertoireItem" ("id", "keyOverride", "order", "scheduleId", "songId") SELECT "id", "keyOverride", "order", "scheduleId", "songId" FROM "ServiceRepertoireItem";
DROP TABLE "ServiceRepertoireItem";
ALTER TABLE "new_ServiceRepertoireItem" RENAME TO "ServiceRepertoireItem";
CREATE INDEX "ServiceRepertoireItem_scheduleId_idx" ON "ServiceRepertoireItem"("scheduleId");
CREATE INDEX "ServiceRepertoireItem_songId_idx" ON "ServiceRepertoireItem"("songId");
CREATE TABLE "new_ServiceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "cycleId" TEXT,
    "date" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'ensaio',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceSchedule_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceSchedule_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceSchedule" ("createdAt", "createdById", "cycleId", "date", "id", "ministryId", "sessionType") SELECT "createdAt", "createdById", "cycleId", "date", "id", "ministryId", "sessionType" FROM "ServiceSchedule";
DROP TABLE "ServiceSchedule";
ALTER TABLE "new_ServiceSchedule" RENAME TO "ServiceSchedule";
CREATE INDEX "ServiceSchedule_ministryId_date_idx" ON "ServiceSchedule"("ministryId", "date");
CREATE INDEX "ServiceSchedule_cycleId_idx" ON "ServiceSchedule"("cycleId");
CREATE TABLE "new_WhatsAppMessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "musicianId" TEXT,
    "sentById" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '{}',
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "responsePayload" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppMessageLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppMessageLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WhatsAppMessageLog" ("context", "id", "messageId", "ministryId", "musicianId", "responsePayload", "sentAt", "sentById", "status", "templateName") SELECT "context", "id", "messageId", "ministryId", "musicianId", "responsePayload", "sentAt", "sentById", "status", "templateName" FROM "WhatsAppMessageLog";
DROP TABLE "WhatsAppMessageLog";
ALTER TABLE "new_WhatsAppMessageLog" RENAME TO "WhatsAppMessageLog";
CREATE INDEX "WhatsAppMessageLog_ministryId_sentAt_status_idx" ON "WhatsAppMessageLog"("ministryId", "sentAt", "status");
CREATE INDEX "WhatsAppMessageLog_musicianId_idx" ON "WhatsAppMessageLog"("musicianId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CueBlock_cueSheetId_idx" ON "CueBlock"("cueSheetId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_sessionId_idx" ON "SessionExecutionLog"("sessionId");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_blockId_idx" ON "SessionExecutionLog"("blockId");

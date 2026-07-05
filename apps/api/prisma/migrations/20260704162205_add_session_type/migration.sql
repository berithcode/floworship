/*
  Warnings:

  - You are about to drop the `Musician` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `musicianId` on the `ServiceAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ServiceAssignment` table. All the data in the column will be lost.
  - Added the required column `name` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Musician_ministryId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "whatsappPhone" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Musician";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryMemberId" TEXT,
    "ministryId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "templateName" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '{}',
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "responsePayload" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationLog_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "ministryMemberId" TEXT NOT NULL,
    "sundayDate" DATETIME NOT NULL,
    "available" BOOLEAN NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityResponse_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvailabilityResponse_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Invite_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invite" ("createdAt", "email", "expiresAt", "id", "invitedById", "ministryId", "role", "token", "usedAt", "usedByUserId") SELECT "createdAt", "email", "expiresAt", "id", "invitedById", "ministryId", "role", "token", "usedAt", "usedByUserId" FROM "Invite";
DROP TABLE "Invite";
ALTER TABLE "new_Invite" RENAME TO "Invite";
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
CREATE TABLE "new_MinistryMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'musician',
    "worshipRoles" TEXT NOT NULL DEFAULT '[]',
    "instrument" TEXT,
    "isActiveInSchedule" BOOLEAN NOT NULL DEFAULT true,
    "timesServedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastServedAt" TEXT NOT NULL DEFAULT '{}',
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "telegramLinkToken" TEXT,
    "whatsappPhone" TEXT,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MinistryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MinistryMember_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MinistryMember" ("createdAt", "id", "ministryId", "role", "updatedAt", "userId") SELECT "createdAt", "id", "ministryId", "role", "updatedAt", "userId" FROM "MinistryMember";
DROP TABLE "MinistryMember";
ALTER TABLE "new_MinistryMember" RENAME TO "MinistryMember";
CREATE INDEX "MinistryMember_ministryId_role_idx" ON "MinistryMember"("ministryId", "role");
CREATE INDEX "MinistryMember_ministryId_isActiveInSchedule_idx" ON "MinistryMember"("ministryId", "isActiveInSchedule");
CREATE UNIQUE INDEX "MinistryMember_userId_ministryId_key" ON "MinistryMember"("userId", "ministryId");
CREATE TABLE "new_ServiceAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "ministryMemberId" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vago',
    "substitutionOf" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    CONSTRAINT "ServiceAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceAssignment_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceAssignment" ("confirmed", "confirmedAt", "id", "role", "scheduleId", "status", "substitutionOf") SELECT "confirmed", "confirmedAt", "id", "role", "scheduleId", "status", "substitutionOf" FROM "ServiceAssignment";
DROP TABLE "ServiceAssignment";
ALTER TABLE "new_ServiceAssignment" RENAME TO "ServiceAssignment";
CREATE INDEX "ServiceAssignment_ministryMemberId_status_idx" ON "ServiceAssignment"("ministryMemberId", "status");
CREATE INDEX "ServiceAssignment_scheduleId_status_idx" ON "ServiceAssignment"("scheduleId", "status");
CREATE TABLE "new_ServiceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "cycleId" TEXT,
    "date" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'ensaio',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceSchedule_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceSchedule_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceSchedule" ("createdAt", "createdById", "date", "id", "ministryId") SELECT "createdAt", "createdById", "date", "id", "ministryId" FROM "ServiceSchedule";
DROP TABLE "ServiceSchedule";
ALTER TABLE "new_ServiceSchedule" RENAME TO "ServiceSchedule";
CREATE INDEX "ServiceSchedule_ministryId_date_idx" ON "ServiceSchedule"("ministryId", "date");
CREATE INDEX "ServiceSchedule_cycleId_idx" ON "ServiceSchedule"("cycleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NotificationLog_ministryId_sentAt_status_idx" ON "NotificationLog"("ministryId", "sentAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityResponse_cycleId_ministryMemberId_sundayDate_key" ON "AvailabilityResponse"("cycleId", "ministryMemberId", "sundayDate");

-- CreateIndex
CREATE INDEX "MonthlyScheduleCycle_ministryId_status_idx" ON "MonthlyScheduleCycle"("ministryId", "status");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_triggeredAt_idx" ON "SessionExecutionLog"("triggeredAt");

-- CreateIndex
CREATE INDEX "Song_ministryId_status_idx" ON "Song"("ministryId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_ministryId_sentAt_status_idx" ON "WhatsAppMessageLog"("ministryId", "sentAt", "status");

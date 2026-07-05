-- AlterTable
ALTER TABLE "Musician" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "Musician" ADD COLUMN "telegramLinkToken" TEXT;
ALTER TABLE "Musician" ADD COLUMN "telegramUsername" TEXT;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musicianId" TEXT,
    "ministryId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "templateName" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '{}',
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "responsePayload" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationLog_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "NotificationLog_ministryId_sentAt_status_idx" ON "NotificationLog"("ministryId", "sentAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityResponse_cycleId_musicianId_key" ON "AvailabilityResponse"("cycleId", "musicianId");

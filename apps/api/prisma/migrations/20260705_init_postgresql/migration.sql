-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('vago', 'confirmado', 'recusado');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('coletando_disponibilidade', 'gerando', 'aguardando_aprovacao', 'publicada', 'cancelada');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('rascunho', 'pronta', 'arquivada');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('enviado', 'entregue', 'lido', 'falhou');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "googleId" TEXT,
    "whatsappPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinistryMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'musician',
    "worshipRoles" JSONB NOT NULL DEFAULT '[]',
    "instrument" TEXT,
    "isActiveInSchedule" BOOLEAN NOT NULL DEFAULT true,
    "timesServedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastServedAt" JSONB NOT NULL DEFAULT '{}',
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "telegramLinkToken" TEXT,
    "whatsappPhone" TEXT,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinistryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'musician',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "defaultKey" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "notes" TEXT,
    "ministryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongCueSheet" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "referenceTrackUrl" TEXT,
    "totalDurationSeconds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongCueSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CueBlock" (
    "id" TEXT NOT NULL,
    "cueSheetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "chordproContent" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CueBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "cycleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'ensaio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAssignment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "ministryMemberId" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vago',
    "substitutionOf" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRepertoireItem" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "keyOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRepertoireItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionExecutionLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasOverride" BOOLEAN NOT NULL DEFAULT false,
    "triggeredByUserId" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION,

    CONSTRAINT "SessionExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessageLog" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "musicianId" TEXT,
    "sentById" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "responsePayload" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "ministryMemberId" TEXT,
    "ministryId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "templateName" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "responsePayload" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyScheduleCycle" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coletando_disponibilidade',
    "availabilityDeadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MonthlyScheduleCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityResponse" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "ministryMemberId" TEXT NOT NULL,
    "sundayDate" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinistryConfig" (
    "ministryId" TEXT NOT NULL,
    "defaultFormation" JSONB NOT NULL DEFAULT '[]',
    "availabilityDeadlineDays" INTEGER NOT NULL DEFAULT 5,
    "substitutionWindowHours" INTEGER NOT NULL DEFAULT 4,
    "cycleTriggerDay" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "MinistryConfig_pkey" PRIMARY KEY ("ministryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "MinistryMember_ministryId_role_idx" ON "MinistryMember"("ministryId", "role");

-- CreateIndex
CREATE INDEX "MinistryMember_ministryId_isActiveInSchedule_idx" ON "MinistryMember"("ministryId", "isActiveInSchedule");

-- CreateIndex
CREATE UNIQUE INDEX "MinistryMember_userId_ministryId_key" ON "MinistryMember"("userId", "ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_phone_idx" ON "Invite"("phone");

-- CreateIndex
CREATE INDEX "Invite_ministryId_usedAt_idx" ON "Invite"("ministryId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Song_ministryId_status_idx" ON "Song"("ministryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SongCueSheet_songId_key" ON "SongCueSheet"("songId");

-- CreateIndex
CREATE INDEX "CueBlock_cueSheetId_idx" ON "CueBlock"("cueSheetId");

-- CreateIndex
CREATE INDEX "ServiceSchedule_ministryId_date_idx" ON "ServiceSchedule"("ministryId", "date");

-- CreateIndex
CREATE INDEX "ServiceSchedule_cycleId_idx" ON "ServiceSchedule"("cycleId");

-- CreateIndex
CREATE INDEX "ServiceAssignment_ministryMemberId_status_idx" ON "ServiceAssignment"("ministryMemberId", "status");

-- CreateIndex
CREATE INDEX "ServiceAssignment_scheduleId_status_idx" ON "ServiceAssignment"("scheduleId", "status");

-- CreateIndex
CREATE INDEX "ServiceAssignment_scheduleId_role_idx" ON "ServiceAssignment"("scheduleId", "role");

-- CreateIndex
CREATE INDEX "ServiceRepertoireItem_scheduleId_idx" ON "ServiceRepertoireItem"("scheduleId");

-- CreateIndex
CREATE INDEX "ServiceRepertoireItem_songId_idx" ON "ServiceRepertoireItem"("songId");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_triggeredAt_idx" ON "SessionExecutionLog"("triggeredAt");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_sessionId_idx" ON "SessionExecutionLog"("sessionId");

-- CreateIndex
CREATE INDEX "SessionExecutionLog_blockId_idx" ON "SessionExecutionLog"("blockId");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_ministryId_sentAt_status_idx" ON "WhatsAppMessageLog"("ministryId", "sentAt", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_musicianId_idx" ON "WhatsAppMessageLog"("musicianId");

-- CreateIndex
CREATE INDEX "NotificationLog_ministryId_sentAt_status_idx" ON "NotificationLog"("ministryId", "sentAt", "status");

-- CreateIndex
CREATE INDEX "MonthlyScheduleCycle_ministryId_status_idx" ON "MonthlyScheduleCycle"("ministryId", "status");

-- CreateIndex
CREATE INDEX "AvailabilityResponse_ministryMemberId_idx" ON "AvailabilityResponse"("ministryMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityResponse_cycleId_ministryMemberId_sundayDate_key" ON "AvailabilityResponse"("cycleId", "ministryMemberId", "sundayDate");

-- AddForeignKey
ALTER TABLE "MinistryMember" ADD CONSTRAINT "MinistryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinistryMember" ADD CONSTRAINT "MinistryMember_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCueSheet" ADD CONSTRAINT "SongCueSheet_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CueBlock" ADD CONSTRAINT "CueBlock_cueSheetId_fkey" FOREIGN KEY ("cueSheetId") REFERENCES "SongCueSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRepertoireItem" ADD CONSTRAINT "ServiceRepertoireItem_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ServiceSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRepertoireItem" ADD CONSTRAINT "ServiceRepertoireItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExecutionLog" ADD CONSTRAINT "SessionExecutionLog_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "CueBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExecutionLog" ADD CONSTRAINT "SessionExecutionLog_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessageLog" ADD CONSTRAINT "WhatsAppMessageLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyScheduleCycle" ADD CONSTRAINT "MonthlyScheduleCycle_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityResponse" ADD CONSTRAINT "AvailabilityResponse_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "MonthlyScheduleCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityResponse" ADD CONSTRAINT "AvailabilityResponse_ministryMemberId_fkey" FOREIGN KEY ("ministryMemberId") REFERENCES "MinistryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinistryConfig" ADD CONSTRAINT "MinistryConfig_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;


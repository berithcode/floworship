/*
  Warnings:

  - Added the required column `updatedAt` to the `MonthlyScheduleCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceSchedule" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyScheduleCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coletando_disponibilidade',
    "availabilityDeadline" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "MonthlyScheduleCycle_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyScheduleCycle" ("availabilityDeadline", "id", "ministryId", "month", "status", "year") SELECT "availabilityDeadline", "id", "ministryId", "month", "status", "year" FROM "MonthlyScheduleCycle";
DROP TABLE "MonthlyScheduleCycle";
ALTER TABLE "new_MonthlyScheduleCycle" RENAME TO "MonthlyScheduleCycle";
CREATE INDEX "MonthlyScheduleCycle_ministryId_status_idx" ON "MonthlyScheduleCycle"("ministryId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

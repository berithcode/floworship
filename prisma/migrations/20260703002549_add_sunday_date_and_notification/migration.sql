/*
  Warnings:

  - Added the required column `sundayDate` to the `AvailabilityResponse` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvailabilityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "sundayDate" DATETIME NOT NULL,
    "available" BOOLEAN NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AvailabilityResponse" ("available", "cycleId", "id", "musicianId", "respondedAt") SELECT "available", "cycleId", "id", "musicianId", "respondedAt" FROM "AvailabilityResponse";
DROP TABLE "AvailabilityResponse";
ALTER TABLE "new_AvailabilityResponse" RENAME TO "AvailabilityResponse";
CREATE UNIQUE INDEX "AvailabilityResponse_cycleId_musicianId_sundayDate_key" ON "AvailabilityResponse"("cycleId", "musicianId", "sundayDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

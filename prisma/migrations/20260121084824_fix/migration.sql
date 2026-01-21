/*
  Warnings:

  - You are about to drop the `PatientSequence` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PatientSequence";

CREATE TABLE IF NOT EXISTS "PatientSequence" (
    "clinicId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PatientSequence_pkey" PRIMARY KEY ("clinicId", "monthKey")
);
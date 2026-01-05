/*
  Warnings:

  - You are about to drop the column `drug` on the `PatientAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `reaction` on the `PatientAllergy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientAllergy" DROP COLUMN "drug",
DROP COLUMN "reaction",
ADD COLUMN     "data" JSONB;

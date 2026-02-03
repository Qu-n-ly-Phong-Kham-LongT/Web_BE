/*
  Warnings:

  - You are about to drop the column `note` on the `PatientAllergy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientAllergy" DROP COLUMN "note",
ADD COLUMN     "drug" TEXT;

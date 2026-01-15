/*
  Warnings:

  - The `drugAllergies` column on the `ClinicalExamination` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ClinicalExamination" DROP COLUMN "drugAllergies",
ADD COLUMN     "drugAllergies" JSONB;

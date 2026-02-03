-- AlterTable
ALTER TABLE "ClinicalExamination" ADD COLUMN     "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBreastfeeding" BOOLEAN NOT NULL DEFAULT false;

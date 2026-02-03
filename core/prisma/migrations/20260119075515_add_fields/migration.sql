-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "printCount" INTEGER DEFAULT 0,
ADD COLUMN     "printedAt" TIMESTAMPTZ;

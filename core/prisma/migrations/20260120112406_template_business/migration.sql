/*
  Warnings:

  - You are about to drop the column `daysToTake` on the `PrescriptionTemplateDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrescriptionTemplate" ADD COLUMN     "daysToTake" INTEGER;

-- AlterTable
ALTER TABLE "PrescriptionTemplateDetail" DROP COLUMN "daysToTake";

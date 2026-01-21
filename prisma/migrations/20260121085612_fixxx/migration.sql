/*
  Warnings:

  - You are about to alter the column `consultationFee` on the `Clinic` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,0)`.
  - You are about to drop the `PatientSequence` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Clinic" ALTER COLUMN "consultationFee" SET DATA TYPE DECIMAL(10,0);

-- AlterTable
ALTER TABLE "Prescription" ALTER COLUMN "printCount" SET DEFAULT 1;

-- DropTable
DROP TABLE "PatientSequence";

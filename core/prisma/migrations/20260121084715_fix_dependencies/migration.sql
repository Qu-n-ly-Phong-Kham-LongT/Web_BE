/*
  Warnings:

  - You are about to drop the `PatientSequence` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Prescription" ALTER COLUMN "prescriptionCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRequest" ALTER COLUMN "requestCode" DROP NOT NULL;

/*
  Warnings:

  - You are about to drop the column `paymentStatus` on the `Prescription` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('Issued', 'Fulfilled');

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "paymentStatus",
ADD COLUMN     "status" "PrescriptionStatus" DEFAULT 'Issued';

-- DropEnum
DROP TYPE "PaymentStatus";

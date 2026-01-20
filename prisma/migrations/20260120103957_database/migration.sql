/*
  Warnings:

  - You are about to drop the column `fileName` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `pdfPath` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `finalReportPath` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `ServiceResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "fileName",
DROP COLUMN "pdfPath",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrescriptionTemplate" ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ServiceItem" ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ServiceNode" ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "finalReportPath",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ServiceResult" DROP COLUMN "images",
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ServiceTemplate" ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;

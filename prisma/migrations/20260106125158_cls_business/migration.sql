/*
  Warnings:

  - You are about to drop the column `groupName` on the `ServiceItemConfig` table. All the data in the column will be lost.
  - You are about to drop the column `metaData` on the `ServiceItemConfig` table. All the data in the column will be lost.
  - You are about to drop the column `serviceResultResultId` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `conclusion` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `isPdf` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `performingDoctorId` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `resultCode` on the `ServiceResult` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `ServiceTemplate` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InputType" ADD VALUE 'Number';
ALTER TYPE "InputType" ADD VALUE 'LongText';

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_serviceResultResultId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceResult" DROP CONSTRAINT "ServiceResult_performingDoctorId_fkey";

-- DropIndex
DROP INDEX "ServiceResult_detailId_key";

-- AlterTable
ALTER TABLE "ServiceItemConfig" DROP COLUMN "groupName",
DROP COLUMN "metaData",
ADD COLUMN     "refRange" TEXT,
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "inputType" SET DEFAULT 'Text';

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "serviceResultResultId",
ADD COLUMN     "finalReportPath" TEXT;

-- AlterTable
ALTER TABLE "ServiceResult" DROP COLUMN "conclusion",
DROP COLUMN "description",
DROP COLUMN "isPdf",
DROP COLUMN "note",
DROP COLUMN "pdfUrl",
DROP COLUMN "performingDoctorId",
DROP COLUMN "resultCode",
ADD COLUMN     "configId" UUID,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "indicatorName" TEXT,
ADD COLUMN     "itemId" UUID,
ADD COLUMN     "parentId" UUID,
ADD COLUMN     "requestId" UUID,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "valueNumber" DECIMAL(10,2),
ADD COLUMN     "valueString" TEXT,
ALTER COLUMN "executedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ServiceTemplate" DROP COLUMN "createdBy";

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ServiceItemConfig"("configId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceResult"("resultId") ON DELETE SET NULL ON UPDATE CASCADE;

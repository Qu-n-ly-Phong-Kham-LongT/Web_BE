/*
  Warnings:

  - Made the column `serviceRequestId` on table `ResultFile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ResultFile" DROP CONSTRAINT "ResultFile_serviceRequestId_fkey";

-- AlterTable
ALTER TABLE "ResultFile" ALTER COLUMN "serviceRequestId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ResultFile" ADD CONSTRAINT "ResultFile_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("requestId") ON DELETE RESTRICT ON UPDATE CASCADE;

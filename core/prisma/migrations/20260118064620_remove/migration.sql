/*
  Warnings:

  - You are about to drop the `ResultFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ResultFile" DROP CONSTRAINT "ResultFile_serviceRequestId_fkey";

-- DropTable
DROP TABLE "ResultFile";

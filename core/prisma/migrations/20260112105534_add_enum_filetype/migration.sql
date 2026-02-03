/*
  Warnings:

  - Changed the type of `Type` on the `File` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('MEDICAL_RECORD', 'PRESCRIPTION', 'SERVICE_REQUEST', 'SERVICE_RESULT', 'OTHER');

-- AlterTable
ALTER TABLE "File" DROP COLUMN "Type",
ADD COLUMN     "Type" "FileType" NOT NULL;

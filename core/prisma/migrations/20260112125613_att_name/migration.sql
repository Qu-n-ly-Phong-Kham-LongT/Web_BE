/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CreatedAt` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `FileID` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `MimeType` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `RelativePath` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `Size` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `Type` on the `File` table. All the data in the column will be lost.
  - Added the required column `mimeType` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relativePath` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "CreatedAt",
DROP COLUMN "FileID",
DROP COLUMN "MimeType",
DROP COLUMN "RelativePath",
DROP COLUMN "Size",
DROP COLUMN "Type",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileID" TEXT NOT NULL DEFAULT uuid_generate_v4(),
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "relativePath" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "type" "FileType" NOT NULL,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("fileID");

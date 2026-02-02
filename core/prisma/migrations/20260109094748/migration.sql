/*
  Warnings:

  - You are about to drop the column `isFollowUp` on the `ServiceRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "isFollowUp",
ADD COLUMN     "isForFollowUp" BOOLEAN NOT NULL DEFAULT false;

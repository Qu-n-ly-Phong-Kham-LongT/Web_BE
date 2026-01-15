/*
  Warnings:

  - You are about to drop the column `userUserId` on the `ClinicalExamination` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicalExamination" DROP CONSTRAINT "ClinicalExamination_userUserId_fkey";

-- AlterTable
ALTER TABLE "ClinicalExamination" DROP COLUMN "userUserId",
ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

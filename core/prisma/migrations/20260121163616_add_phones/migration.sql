/*
  Warnings:

  - You are about to drop the column `phone` on the `Clinic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Clinic" DROP COLUMN "phone",
ADD COLUMN     "phones" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[];

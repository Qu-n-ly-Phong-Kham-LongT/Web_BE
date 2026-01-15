/*
  Warnings:

  - You are about to drop the column `price` on the `PrescriptionDetail` table. All the data in the column will be lost.
  - You are about to alter the column `appliedExportPrice` on the `PrescriptionDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,3)`.

*/
-- AlterTable
ALTER TABLE "PrescriptionDetail" DROP COLUMN "price",
ADD COLUMN     "totalPrice" DECIMAL(18,3),
ALTER COLUMN "appliedExportPrice" SET DATA TYPE DECIMAL(18,3);

/*
  Warnings:

  - You are about to alter the column `unitPrice` on the `InventoryLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `totalPrice` on the `InventoryLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `consultationFee` on the `MedicalRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `insurancePrice` on the `Medicine` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `sellPrice` on the `Medicine` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `totalPrice` on the `Prescription` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.
  - You are about to alter the column `quantityPerTime` on the `PrescriptionDetail` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `PrescriptionDetail` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `appliedExportPrice` on the `PrescriptionDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,3)` to `Decimal(18,0)`.
  - You are about to alter the column `totalPrice` on the `PrescriptionDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,3)` to `Decimal(18,0)`.
  - You are about to alter the column `basePrice` on the `ServiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,0)`.

*/
-- AlterTable
ALTER TABLE "InventoryLog" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(18,0),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(18,0);

-- AlterTable
ALTER TABLE "MedicalRecord" ALTER COLUMN "consultationFee" SET DATA TYPE DECIMAL(18,0);

-- AlterTable
ALTER TABLE "Medicine" ALTER COLUMN "insurancePrice" SET DATA TYPE DECIMAL(18,0),
ALTER COLUMN "sellPrice" SET DATA TYPE DECIMAL(18,0);

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(18,0);

-- AlterTable
ALTER TABLE "PrescriptionDetail" ALTER COLUMN "quantityPerTime" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "appliedExportPrice" SET DATA TYPE DECIMAL(18,0),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(18,0);

-- AlterTable
ALTER TABLE "ServiceItem" ALTER COLUMN "basePrice" SET DATA TYPE DECIMAL(18,0);

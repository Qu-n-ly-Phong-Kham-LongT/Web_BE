-- AlterTable
ALTER TABLE "InventoryLog" ADD COLUMN     "prescriptionId" UUID;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "dispensedAt" TIMESTAMPTZ,
ADD COLUMN     "dispensedBy" UUID,
ADD COLUMN     "isDispensed" BOOLEAN DEFAULT false;

/*
  Warnings:

  - The values [Fulfilled] on the enum `PrescriptionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrescriptionStatus_new" AS ENUM ('Draft', 'Issued', 'Cancelled');
ALTER TABLE "public"."Prescription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Prescription" ALTER COLUMN "status" TYPE "PrescriptionStatus_new" USING ("status"::text::"PrescriptionStatus_new");
ALTER TYPE "PrescriptionStatus" RENAME TO "PrescriptionStatus_old";
ALTER TYPE "PrescriptionStatus_new" RENAME TO "PrescriptionStatus";
DROP TYPE "public"."PrescriptionStatus_old";
ALTER TABLE "Prescription" ALTER COLUMN "status" SET DEFAULT 'Issued';
COMMIT;

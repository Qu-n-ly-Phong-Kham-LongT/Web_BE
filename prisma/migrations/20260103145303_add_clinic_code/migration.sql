/*
  Warnings:

  - The values [Staff] on the enum `UserRoleEnum` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[ClinicCode]` on the table `Clinics` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRoleEnum_new" AS ENUM ('Manager', 'Doctor', 'Admin');
ALTER TABLE "Roles" ALTER COLUMN "RoleName" TYPE "UserRoleEnum_new" USING ("RoleName"::text::"UserRoleEnum_new");
ALTER TYPE "UserRoleEnum" RENAME TO "UserRoleEnum_old";
ALTER TYPE "UserRoleEnum_new" RENAME TO "UserRoleEnum";
DROP TYPE "public"."UserRoleEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "Clinics" ADD COLUMN     "ClinicCode" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "Clinics_ClinicCode_key" ON "Clinics"("ClinicCode");

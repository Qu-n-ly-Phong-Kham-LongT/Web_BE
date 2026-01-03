/*
  Warnings:

  - You are about to drop the column `Phone` on the `Users` table. All the data in the column will be lost.
  - You are about to alter the column `Username` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `Password` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `FullName` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `Email` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - A unique constraint covering the columns `[RoleName]` on the table `Roles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `RoleName` on table `Roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Username` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Password` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `FullName` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Status` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Created_At` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Updated_At` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_UserID_fkey";

-- DropIndex
DROP INDEX "Users_Phone_key";

-- AlterTable
ALTER TABLE "Roles" ALTER COLUMN "RoleName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "Phone",
ALTER COLUMN "Username" SET NOT NULL,
ALTER COLUMN "Username" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "Password" SET NOT NULL,
ALTER COLUMN "Password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "FullName" SET NOT NULL,
ALTER COLUMN "FullName" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "Email" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "Status" SET NOT NULL,
ALTER COLUMN "Created_At" SET NOT NULL,
ALTER COLUMN "Updated_At" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Roles_RoleName_key" ON "Roles"("RoleName");

-- CreateIndex
CREATE INDEX "UserRoles_UserID_idx" ON "UserRoles"("UserID");

-- CreateIndex
CREATE INDEX "UserRoles_RoleID_idx" ON "UserRoles"("RoleID");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

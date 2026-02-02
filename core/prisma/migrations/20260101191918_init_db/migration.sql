-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('Manager', 'Doctor', 'Admin');

-- CreateTable
CREATE TABLE "Roles" (
    "RoleID" UUID NOT NULL,
    "RoleName" "UserRoleEnum" NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("RoleID")
);

-- CreateTable
CREATE TABLE "Users" (
    "UserID" UUID NOT NULL,
    "Username" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "FullName" TEXT NOT NULL,
    "Phone" TEXT,
    "Email" TEXT,
    "Status" "UserStatus" NOT NULL DEFAULT 'Active',
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "UserRoles" (
    "UserID" UUID NOT NULL,
    "RoleID" UUID NOT NULL,

    CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("UserID","RoleID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Phone_key" ON "Users"("Phone");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_RoleID_fkey" FOREIGN KEY ("RoleID") REFERENCES "Roles"("RoleID") ON DELETE RESTRICT ON UPDATE CASCADE;

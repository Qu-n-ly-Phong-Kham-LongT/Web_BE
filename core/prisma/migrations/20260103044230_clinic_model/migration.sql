/*
  Warnings:

  - Added the required column `Clinic_ID` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "Clinic_ID" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Clinics" (
    "ClinicID" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ClinicName" VARCHAR(255),
    "Address" VARCHAR(255),
    "Phone" VARCHAR(255),
    "Email" VARCHAR(150),

    CONSTRAINT "Clinics_pkey" PRIMARY KEY ("ClinicID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinics_Email_key" ON "Clinics"("Email");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_Clinic_ID_fkey" FOREIGN KEY ("Clinic_ID") REFERENCES "Clinics"("ClinicID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "MedicalRecordSequence" DROP CONSTRAINT "MedicalRecordSequence_patientId_fkey";

-- DropIndex
DROP INDEX "File_medicalRecordId_key";

-- AddForeignKey
ALTER TABLE "MedicalRecordSequence" ADD CONSTRAINT "MedicalRecordSequence_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate MedicalRecordSequence after conflicting migration removed patientId
-- Safe: only affects sequence counters, not medical record data.
DROP TABLE IF EXISTS "MedicalRecordSequence";

CREATE TABLE IF NOT EXISTS "MedicalRecordSequence" (
    "patientId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("patientId", "monthKey"),
    CONSTRAINT "MedicalRecordSequence_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE CASCADE
);

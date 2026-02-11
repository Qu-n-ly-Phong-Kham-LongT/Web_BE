-- Align MedicalRecordSequence table with new per-patient sequence
-- Old shape: (monthKey, currentVal)
-- New shape: (patientId, monthKey, currentVal)

DROP TABLE IF EXISTS "MedicalRecordSequence";

CREATE TABLE IF NOT EXISTS "MedicalRecordSequence" (
    "patientId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("patientId", "monthKey"),
    CONSTRAINT "MedicalRecordSequence_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE CASCADE
);

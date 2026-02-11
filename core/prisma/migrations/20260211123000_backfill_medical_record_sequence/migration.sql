-- Backfill MedicalRecordSequence based on existing MedicalRecord data
-- Ensures next sequence value won't collide with existing records.

INSERT INTO "MedicalRecordSequence" ("patientId", "monthKey", "currentVal")
SELECT
  mr."patientId",
  to_char(mr."createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') AS "monthKey",
  COUNT(*)::INT AS "currentVal"
FROM "MedicalRecord" mr
WHERE mr."patientId" IS NOT NULL
  AND mr."createdAt" IS NOT NULL
GROUP BY mr."patientId", to_char(mr."createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY')
ON CONFLICT ("patientId", "monthKey")
DO UPDATE SET "currentVal" = GREATEST("MedicalRecordSequence"."currentVal", EXCLUDED."currentVal");

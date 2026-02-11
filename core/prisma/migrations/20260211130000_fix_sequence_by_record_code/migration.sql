-- Backfill MedicalRecordSequence from recordCode (authoritative) and
-- update trigger to keep sequence in sync with existing recordCode.

-- 1) Backfill sequence from recordCode
INSERT INTO "MedicalRecordSequence" ("patientId", "monthKey", "currentVal")
SELECT
  mr."patientId",
  SUBSTRING(mr."recordCode" FROM '.{10}(.{4})..$') AS "monthKey",
  MAX(CAST(RIGHT(mr."recordCode", 2) AS INT)) AS "currentVal"
FROM "MedicalRecord" mr
WHERE mr."patientId" IS NOT NULL
  AND mr."recordCode" IS NOT NULL
  AND LENGTH(mr."recordCode") >= 14
GROUP BY mr."patientId", SUBSTRING(mr."recordCode" FROM '.{10}(.{4})..$')
ON CONFLICT ("patientId", "monthKey")
DO UPDATE SET "currentVal" = GREATEST("MedicalRecordSequence"."currentVal", EXCLUDED."currentVal");

-- 2) Update trigger to use sequence and sync with existing recordCode
CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _p_code TEXT;
    _p_numbers TEXT;
    _seq_val INT;
    _month_key TEXT;
    _created_at TIMESTAMPTZ;
    _max_existing INT;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        SELECT "patientCode" INTO _p_code FROM "Patient" WHERE "patientId" = NEW."patientId";
        _p_numbers := regexp_replace(_p_code, '^.*-', '');

        _created_at := COALESCE(NEW."createdAt", now());
        _month_key := to_char(_created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        -- ensure sequence is at least the max seq already present in recordCode
        SELECT MAX(CAST(RIGHT("recordCode", 2) AS INT)) INTO _max_existing
        FROM "MedicalRecord"
        WHERE "patientId" = NEW."patientId"
          AND "recordCode" LIKE ('BA-' || _p_numbers || _month_key || '%');

        INSERT INTO "MedicalRecordSequence" ("patientId", "monthKey", "currentVal")
        VALUES (NEW."patientId", _month_key, COALESCE(_max_existing, 0))
        ON CONFLICT ("patientId", "monthKey")
        DO UPDATE SET "currentVal" = GREATEST("MedicalRecordSequence"."currentVal", COALESCE(_max_existing, 0))
        RETURNING "currentVal" INTO _seq_val;

        -- increment sequence for this new record
        UPDATE "MedicalRecordSequence"
        SET "currentVal" = "currentVal" + 1
        WHERE "patientId" = NEW."patientId" AND "monthKey" = _month_key
        RETURNING "currentVal" INTO _seq_val;

        NEW."recordCode" := 'BA-' || _p_numbers || _month_key || LPAD(_seq_val::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

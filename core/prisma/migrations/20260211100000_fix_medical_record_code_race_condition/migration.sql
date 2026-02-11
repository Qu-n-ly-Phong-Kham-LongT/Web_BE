-- Use per-patient sequence per month to avoid race conditions when generating recordCode
CREATE TABLE IF NOT EXISTS "MedicalRecordSequence" (
    "patientId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("patientId", "monthKey")
);

CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _p_code TEXT;
    _p_numbers TEXT;
    _seq_val INT;
    _month_key TEXT;
    _created_at TIMESTAMPTZ;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        SELECT "patientCode" INTO _p_code FROM "Patient" WHERE "patientId" = NEW."patientId";
        _p_numbers := regexp_replace(_p_code, '^.*-', '');

        _created_at := COALESCE(NEW."createdAt", now());
        _month_key := to_char(_created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        INSERT INTO "MedicalRecordSequence" ("patientId", "monthKey", "currentVal")
        VALUES (NEW."patientId", _month_key, 1)
        ON CONFLICT ("patientId", "monthKey")
        DO UPDATE SET "currentVal" = "MedicalRecordSequence"."currentVal" + 1
        RETURNING "currentVal" INTO _seq_val;

        NEW."recordCode" := 'BA-' || _p_numbers || _month_key || LPAD(_seq_val::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

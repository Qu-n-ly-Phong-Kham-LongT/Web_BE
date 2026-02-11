-- Use NEW.createdAt (not now()) when generating MedicalRecord.recordCode
-- so legacy records get codes for their actual month.
CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _p_code TEXT;
    _p_numbers TEXT;
    _ba_count INT;
    _month_key TEXT;
    _created_at TIMESTAMPTZ;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        SELECT "patientCode" INTO _p_code FROM "Patient" WHERE "patientId" = NEW."patientId";
        _p_numbers := regexp_replace(_p_code, '^.*-', '');

        _created_at := COALESCE(NEW."createdAt", now());
        _month_key := to_char(_created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        SELECT COUNT(*) + 1 INTO _ba_count
        FROM "MedicalRecord"
        WHERE "patientId" = NEW."patientId"
          AND to_char("createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') = _month_key;

        NEW."recordCode" := 'BA-' || _p_numbers || _month_key || LPAD(_ba_count::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

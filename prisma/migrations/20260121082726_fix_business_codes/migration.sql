CREATE TABLE IF NOT EXISTS "PatientSequence" (
    "clinicId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PatientSequence_pkey" PRIMARY KEY ("clinicId", "monthKey")
);

-- =============================================================
-- 1. DỌN DẸP TRIGGER CŨ
-- =============================================================
DROP TRIGGER IF EXISTS ensure_medical_record_code ON "MedicalRecord";
DROP TRIGGER IF EXISTS trg_sr_gen_request_code ON "ServiceRequest";
DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";

-- =============================================================
-- 2. HÀM SINH MÃ BỆNH NHÂN (PATIENT)
-- Format: [ClinicCode]-[MMYY_đăng_ký][4 số STT] 
-- Ví dụ: PK1-01260001
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_patient_code()
RETURNS TRIGGER AS $$
DECLARE
    _clinic_code TEXT;
    _month_key TEXT;
    _seq_val INT;
BEGIN
    IF NEW."patientCode" IS NULL OR NEW."patientCode" = '' THEN
        SELECT "clinicCode" INTO _clinic_code FROM "Clinic" WHERE "clinicId" = NEW."clinicId";
        IF _clinic_code IS NULL THEN _clinic_code := 'BN'; END IF;

        _month_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        INSERT INTO "PatientSequence" ("clinicId", "monthKey", "currentVal")
        VALUES (NEW."clinicId", _month_key, 1)
        ON CONFLICT ("clinicId", "monthKey") 
        DO UPDATE SET "currentVal" = "PatientSequence"."currentVal" + 1
        RETURNING "currentVal" INTO _seq_val;

        NEW."patientCode" := _clinic_code || '-' || _month_key || LPAD(_seq_val::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 3. HÀM SINH MÃ BỆNH ÁN (BA) - CẬP NHẬT UNIQUE
-- Format: BA-[Dãy số PatientCode][mmYY_hiện_tại][2 số STT của BN trong tháng]
-- Ví dụ: BA-01260001 0226 01 (BN số 0001 tháng 01/26, đi khám vào tháng 02/26, lần 1)
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _p_code TEXT;
    _p_numbers TEXT;
    _ba_count INT;
    _current_month_key TEXT;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        -- 1. Lấy mã BN và trích xuất phần số (VD: 01260001)
        SELECT "patientCode" INTO _p_code FROM "Patient" WHERE "patientId" = NEW."patientId";
        _p_numbers := regexp_replace(_p_code, '^.*-', ''); 

        -- 2. Lấy mmYY hiện tại
        _current_month_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        -- 3. Đếm số bệnh án của BN này TRONG THÁNG HIỆN TẠI
        SELECT COUNT(*) + 1 INTO _ba_count 
        FROM "MedicalRecord" 
        WHERE "patientId" = NEW."patientId" 
          AND to_char("createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') = _current_month_key;

        -- 4. Ghép mã: BA + Dãy số BN + Tháng hiện tại + STT trong tháng
        NEW."recordCode" := 'BA-' || _p_numbers || _current_month_key || LPAD(_ba_count::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 4. HÀM SINH MÃ PHIẾU CLS (Kế thừa BA)
-- Format: CLS-[Dãy số từ BA]-[STT CLS]
-- Ví dụ: CLS-01260001022601-01
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_service_request_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
    _cls_count INT;
BEGIN
    IF NEW."requestCode" IS NULL OR NEW."requestCode" = '' THEN
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";
        _ba_numbers := SUBSTRING(_ba_code FROM 4); -- Bỏ 'BA-'

        SELECT COUNT(*) + 1 INTO _cls_count FROM "ServiceRequest" WHERE "recordId" = NEW."recordId";

        NEW."requestCode" := 'CLS-' || _ba_numbers || '-' || LPAD(_cls_count::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 5. HÀM SINH MÃ TOA THUỐC (Kế thừa BA)
-- Format: TOA-[Dãy số từ BA]
-- Ví dụ: TOA-01260001022601
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_prescription_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
BEGIN
    IF NEW."prescriptionCode" IS NULL OR NEW."prescriptionCode" = '' THEN
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";
        _ba_numbers := SUBSTRING(_ba_code FROM 4);

        NEW."prescriptionCode" := 'TOA-' || _ba_numbers;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 6. GÁN TRIGGER
-- =============================================================
CREATE TRIGGER trg_patient_gen_code BEFORE INSERT ON "Patient" FOR EACH ROW EXECUTE FUNCTION trg_generate_patient_code();
CREATE TRIGGER ensure_medical_record_code BEFORE INSERT ON "MedicalRecord" FOR EACH ROW EXECUTE FUNCTION trg_generate_medical_record_code();
CREATE TRIGGER trg_sr_gen_request_code BEFORE INSERT ON "ServiceRequest" FOR EACH ROW EXECUTE FUNCTION trg_generate_service_request_code();
CREATE TRIGGER trg_pres_gen_code BEFORE INSERT ON "Prescription" FOR EACH ROW EXECUTE FUNCTION trg_generate_prescription_code();
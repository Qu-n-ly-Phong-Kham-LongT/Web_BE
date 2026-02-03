-- =============================================================
-- 1. DỌN DẸP TOÀN BỘ CẤU HÌNH CŨ (Tránh xung đột)
-- =============================================================
-- Xóa Trigger
DROP TRIGGER IF EXISTS ensure_medical_record_code ON "MedicalRecord";
DROP TRIGGER IF EXISTS trg_sr_gen_request_code ON "ServiceRequest";
DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";

-- Xóa Default values
ALTER TABLE "MedicalRecord" ALTER COLUMN "recordCode" DROP DEFAULT;
ALTER TABLE "Prescription" ALTER COLUMN "prescriptionCode" DROP DEFAULT;

-- Xóa các hàm cũ không còn sử dụng
DROP FUNCTION IF EXISTS pres_gen_code();
DROP FUNCTION IF EXISTS sr_gen_request_code();

-- =============================================================
-- 2. HÀM SINH MÃ BỆNH ÁN (MedicalRecord)
-- Format: BA-[MMYY][PatientSeq:2][GlobalSeq:5]
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _month_key TEXT;
    _global_seq INT;
    _patient_seq INT;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        _month_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        -- A. Lấy số thứ tự TỔNG trong tháng
        INSERT INTO "MedicalRecordSequence" ("monthKey", "currentVal")
        VALUES (_month_key, 1)
        ON CONFLICT ("monthKey") 
        DO UPDATE SET "currentVal" = "MedicalRecordSequence"."currentVal" + 1
        RETURNING "currentVal" INTO _global_seq;

        -- B. Lấy số thứ tự của RIÊNG bệnh nhân này trong tháng
        SELECT COUNT(*) + 1 INTO _patient_seq
        FROM "MedicalRecord"
        WHERE "patientId" = NEW."patientId"
          AND to_char("createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') = _month_key;

        NEW."recordCode" := 'BA-' || _month_key 
                           || LPAD(_patient_seq::TEXT, 2, '0') 
                           || LPAD(_global_seq::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 3. HÀM SINH MÃ CHỈ ĐỊNH (ServiceRequest)
-- Format: CLS-[Dãy số từ BA]-[ServiceRequestSeq:2]
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_service_request_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
    _request_seq INT;
BEGIN
    IF NEW."requestCode" IS NULL OR NEW."requestCode" = '' THEN
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";

        IF _ba_code IS NOT NULL THEN
            _ba_numbers := SUBSTRING(_ba_code FROM 4);
        ELSE
            _ba_numbers := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') || '0000000';
        END IF;

        SELECT COUNT(*) + 1 INTO _request_seq
        FROM "ServiceRequest"
        WHERE "recordId" = NEW."recordId";

        NEW."requestCode" := 'CLS-' || _ba_numbers || '-' || LPAD(_request_seq::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 4. HÀM SINH MÃ TOA THUỐC (Prescription)
-- Format: TOA-[Dãy số từ BA]
-- =============================================================
CREATE OR REPLACE FUNCTION trg_generate_prescription_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
BEGIN
    IF NEW."prescriptionCode" IS NULL OR NEW."prescriptionCode" = '' THEN
        -- 1. Tìm mã bệnh án
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";

        -- 2. Trích xuất dãy số
        IF _ba_code IS NOT NULL THEN
            _ba_numbers := SUBSTRING(_ba_code FROM 4);
        ELSE
            -- Dự phòng nếu chưa có BA (ví dụ tạo rời)
            _ba_numbers := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY') || '9999999';
        END IF;

        -- 3. Gán mã TOA
        NEW."prescriptionCode" := 'TOA-' || _ba_numbers;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 5. ÁP DỤNG CÁC TRIGGER (BEFORE INSERT)
-- =============================================================

-- Cho Bệnh án
CREATE TRIGGER ensure_medical_record_code
BEFORE INSERT ON "MedicalRecord"
FOR EACH ROW EXECUTE FUNCTION trg_generate_medical_record_code();

-- Cho Chỉ định dịch vụ
CREATE TRIGGER trg_sr_gen_request_code
BEFORE INSERT ON "ServiceRequest"
FOR EACH ROW EXECUTE FUNCTION trg_generate_service_request_code();

-- Cho Toa thuốc
CREATE TRIGGER trg_pres_gen_code
BEFORE INSERT ON "Prescription"
FOR EACH ROW EXECUTE FUNCTION trg_generate_prescription_code();
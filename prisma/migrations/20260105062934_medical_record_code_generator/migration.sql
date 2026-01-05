--Function sinh mã chuẩn BA-[MMYY][000000]
CREATE OR REPLACE FUNCTION generate_record_code()
RETURNS TEXT AS $$
DECLARE
    _month_key TEXT;
    _seq_val INT;
    _result TEXT;
BEGIN
    -- Lấy tháng năm hiện tại (Format: MMYY, ví dụ: 0126)
    _month_key := to_char(now(), 'MMYY');

    -- Kỹ thuật UPSERT:
    -- Nếu tháng này chưa có record -> Insert số 1
    -- Nếu tháng này đã có record -> Tăng lên 1
    INSERT INTO "MedicalRecordSequence" ("monthKey", "currentVal")
    VALUES (_month_key, 1)
    ON CONFLICT ("monthKey") 
    DO UPDATE SET "currentVal" = "MedicalRecordSequence"."currentVal" + 1
    RETURNING "currentVal" INTO _seq_val;

    -- Format kết quả: BA-0126000005
    _result := 'BA-' || _month_key || LPAD(_seq_val::TEXT, 6, '0');

    RETURN _result;
END;
$$ LANGUAGE plpgsql;

-- AlterTable
ALTER TABLE "MedicalRecord" ALTER COLUMN "recordCode" SET DEFAULT generate_record_code();

-- CreateTable
CREATE TABLE "MedicalRecordSequence" (
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("monthKey")
);

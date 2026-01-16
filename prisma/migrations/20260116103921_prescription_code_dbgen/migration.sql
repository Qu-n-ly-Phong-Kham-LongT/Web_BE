-- 1. Thêm cột mới nhưng cho phép NULL tạm thời
ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "prescriptionCode" TEXT;

-- 2. Khai báo Function tạo mã (như bạn đã viết)
CREATE OR REPLACE FUNCTION pres_gen_code()
RETURNS trigger AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('Prescription_prescriptionCode_gen'));
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');
  code := 'TOA-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');

  WHILE EXISTS (SELECT 1 FROM "Prescription" WHERE "prescriptionCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'TOA-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');
  END LOOP;

  NEW."prescriptionCode" := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo Trigger (Chỉ áp dụng cho các dòng INSERT sau này)
DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";
CREATE TRIGGER trg_pres_gen_code
BEFORE INSERT ON "Prescription"
FOR EACH ROW
EXECUTE FUNCTION pres_gen_code();

-- 4. QUAN TRỌNG: Cập nhật dữ liệu cho các dòng ĐÃ TỒN TẠI
-- Chúng ta sẽ tạo mã tạm thời dựa trên prescriptionId (UUID) để đảm bảo không trùng
UPDATE "Prescription"
SET "prescriptionCode" = 'TOA-OLD-' || SUBSTRING(CAST("prescriptionId" AS TEXT), 1, 8)
WHERE "prescriptionCode" IS NULL;

-- 5. Bây giờ cột đã có dữ liệu, ta có thể đặt NOT NULL và UNIQUE
ALTER TABLE "Prescription" ALTER COLUMN "prescriptionCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Prescription_prescriptionCode_key" ON "Prescription"("prescriptionCode");
/*
  Warnings:
  - Cập nhật định dạng mã toa thuốc thành TOA-ddMMyyyy-hhmmss
  - Xử lý lỗi 'trigger functions can only be called as triggers' bằng cách chuyển sang RETURNS TEXT
*/

-- 1. Gỡ bỏ giá trị mặc định cũ và xóa hàm cũ (Dùng CASCADE để dọn dẹp tuyệt đối các phụ thuộc)
ALTER TABLE "Prescription" ALTER COLUMN "prescriptionCode" DROP DEFAULT;
DROP FUNCTION IF EXISTS pres_gen_code() CASCADE;
DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";

-- 2. Tạo hàm mới trả về TEXT (Đúng định dạng TOA-ddMMyyyy-hhmmss)
CREATE OR REPLACE FUNCTION pres_gen_code()
RETURNS text AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  -- Khóa giao dịch để đảm bảo tính duy nhất khi nhiều người cùng tạo toa
  PERFORM pg_advisory_xact_lock(hashtext('Prescription_prescriptionCode_gen'));

  -- Lấy thời gian hiện tại múi giờ VN
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  -- Định dạng: TOA-ddMMyyyy-HH24MISS (HH24 để tránh trùng sáng chiều)
  code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');

  -- Nguyên lý chống trùng lặp: Nếu trùng thì cộng thêm 1 giây
  WHILE EXISTS (SELECT 1 FROM "Prescription" WHERE "prescriptionCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 3. Cập nhật dữ liệu cũ (Quan trọng: Tránh lỗi khi SET NOT NULL)
-- Các bản ghi cũ chưa có mã sẽ được gán mã tạm dựa trên ID
UPDATE "Prescription"
SET "prescriptionCode" = 'TOA-OLD-' || SUBSTRING(CAST("prescriptionId" AS TEXT), 1, 8)
WHERE "prescriptionCode" IS NULL;

-- 4. Thay đổi cấu trúc bảng: Gán Default mới và đặt NOT NULL
ALTER TABLE "Prescription" 
  ALTER COLUMN "prescriptionCode" SET NOT NULL,
  ALTER COLUMN "prescriptionCode" SET DEFAULT pres_gen_code();

-- 5. Tạo Index UNIQUE (Chỉ tạo nếu chưa tồn tại)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Prescription_prescriptionCode_key') THEN
        CREATE UNIQUE INDEX "Prescription_prescriptionCode_key" ON "Prescription"("prescriptionCode");
    END IF;
END $$;
-- 1. Thêm cột mới nhưng cho phép NULL tạm thời
ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "prescriptionCode" TEXT;

-- 2. Khai báo Function tạo mã (như bạn đã viết)
-- 1. Xóa hàm cũ nếu tồn tại để tránh xung đột kiểu trả về
DROP FUNCTION IF EXISTS pres_gen_code();

-- 2. Tạo hàm mới trả về TEXT
CREATE OR REPLACE FUNCTION pres_gen_code()
RETURNS text AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  -- GIỮ NGUYÊN: Khóa giao dịch để đảm bảo không có 2 request sinh mã cùng lúc
  PERFORM pg_advisory_xact_lock(hashtext('Prescription_prescriptionCode_gen'));

  -- Lấy thời gian hiện tại theo múi giờ Việt Nam
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  -- ĐỊNH DẠNG: TOA-ddMMyyyy-hhmmss
  -- Lưu ý: HH24 là định dạng 24 giờ để tránh trùng lặp sáng/chiều
  code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');

  -- GIỮ NGUYÊN: Nguyên lý chống trùng lặp
  -- Nếu mã đã tồn tại, cộng thêm 1 giây và kiểm tra lại cho đến khi tìm được mã duy nhất
  WHILE EXISTS (SELECT 1 FROM "Prescription" WHERE "prescriptionCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');
  END LOOP;

  -- TRẢ VỀ: Chuỗi ký tự code (Không dùng NEW nữa vì đây không còn là trigger)
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 3. Đảm bảo xóa Trigger cũ (vì chúng ta dùng cơ chế DEFAULT)
DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";

-- 4. Thiết lập cột prescriptionCode nhận hàm này làm mặc định
ALTER TABLE "Prescription" ALTER COLUMN "prescriptionCode" SET DEFAULT pres_gen_code();
/*
  Warnings:

  - Made the column `requestCode` on table `ServiceRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- 1) (Khuyến nghị) đảm bảo cột NOT NULL
ALTER TABLE "ServiceRequest"
  ALTER COLUMN "requestCode" SET NOT NULL;

-- 2) Function generate code
CREATE OR REPLACE FUNCTION sr_gen_request_code()
RETURNS trigger AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  -- Khóa theo transaction để tránh 2 request generate cùng lúc
  PERFORM pg_advisory_xact_lock(hashtext('ServiceRequest_requestCode_gen'));

  -- Lấy thời gian theo VN (đúng giờ HCM)
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  code := 'CLS-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');

  -- Nếu đã tồn tại, nhích sang giây tiếp theo cho đến khi unique
  WHILE EXISTS (SELECT 1 FROM "ServiceRequest" WHERE "requestCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'CLS-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');
  END LOOP;

  NEW."requestCode" := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger
DROP TRIGGER IF EXISTS trg_sr_gen_request_code ON "ServiceRequest";
CREATE TRIGGER trg_sr_gen_request_code
BEFORE INSERT ON "ServiceRequest"
FOR EACH ROW
EXECUTE FUNCTION sr_gen_request_code();

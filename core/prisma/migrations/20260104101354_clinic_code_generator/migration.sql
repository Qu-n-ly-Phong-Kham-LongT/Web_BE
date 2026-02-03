-- 1. Tạo Sequence
CREATE SEQUENCE IF NOT EXISTS clinic_code_seq START 1;

-- 2. Tạo Function sinh mã
CREATE OR REPLACE FUNCTION generate_clinic_code() 
RETURNS TEXT AS $$
DECLARE
    seq_val INT;
    letters TEXT := '';
    numbers TEXT;
    temp_val INT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
BEGIN
    -- Lấy giá trị từ sequence
    seq_val := nextval('clinic_code_seq');
    
    -- Xử lý phần số (3 số cuối: ví dụ 001, 002...)
    numbers := LPAD(((seq_val - 1) % 1000 + 1)::TEXT, 3, '0');
    
    -- Xử lý phần chữ (3 chữ cái đầu: AAA, AAB...)
    temp_val := (seq_val - 1) / 1000;
    letters := substr(chars, ((temp_val / (26 * 26)) % 26) + 1, 1) ||
               substr(chars, ((temp_val / 26) % 26) + 1, 1) ||
               substr(chars, (temp_val % 26) + 1, 1);
               
    RETURN letters || numbers;
END;
$$ LANGUAGE plpgsql;

-- AlterTable
ALTER TABLE "Clinic" ALTER COLUMN "clinicCode" SET DEFAULT generate_clinic_code();

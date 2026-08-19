-- =====================================================================
-- CHỈ CHẠY 1 LẦN DUY NHẤT: khi volume pg-data còn rỗng (lần deploy đầu).
-- Các lần deploy sau Postgres bỏ qua thư mục này.
-- Mọi câu lệnh ở đây phải idempotent để an toàn.
-- =====================================================================

-- Bắt buộc: schema.prisma dùng uuid_generate_v4() làm default cho hầu hết PK.
-- (Migration 20260102195012_add_uuid_v4 cũng tạo, để sẵn ở đây cho chắc.)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tùy chọn nhưng nên có: tìm kiếm tên bệnh nhân / thuốc không dấu, gần đúng.
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Timezone mặc định của DB (schema dùng @db.Timestamptz).
DO $$
BEGIN
  EXECUTE format(
    'ALTER DATABASE %I SET timezone TO %L',
    current_database(),
    coalesce(nullif(current_setting('app.tz', true), ''), 'Asia/Ho_Chi_Minh')
  );
END
$$;

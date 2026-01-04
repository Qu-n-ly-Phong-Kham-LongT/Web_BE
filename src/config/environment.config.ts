import dotenv from 'dotenv';

dotenv.config();

interface _ENV {
  port: number;
  appName: string;
  swaggerUsername: string;
  swaggerPassword: string;
  databaseUrl: string;
  cors: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

const parseCors = (): string[] => {
  const raw = process.env.CORS_ORIGIN;

  if (!raw || raw.trim() === "" || raw.trim() === "*") return [];

  return raw.split(",").map((o) => o.trim()).filter(Boolean);
};

const ENV: _ENV = {
  port: Number(process.env.PORT) || 3000,
  appName: process.env.APP_NAME || 'QuanLyPhongKhamBE',
  swaggerUsername: process.env.SWAGGER_USERNAME || 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD || 'admin',
  databaseUrl: process.env.DATABASE_URL || '',
  cors: parseCors(),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
};

export default ENV;
import dotenv from 'dotenv';

dotenv.config();

interface _ENV {
  port: number;
  appName: string;
  swaggerUsername: string;
  swaggerPassword: string;
  databaseUrl: string;
}

const ENV: _ENV = {
  port: Number(process.env.PORT) || 3000,
  appName: process.env.APP_NAME || 'QuanLyPhongKhamBE',
  swaggerUsername: process.env.SWAGGER_USERNAME || 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD || 'admin',
  databaseUrl: process.env.DATABASE_URL || '',
};

export default ENV;
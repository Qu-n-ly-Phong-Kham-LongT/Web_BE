import dotenv from 'dotenv';

dotenv.config();

interface _ENV {
  port: number;
}

const ENV: _ENV = {
  port: Number(process.env.PORT) || 3000,
};

export default ENV;
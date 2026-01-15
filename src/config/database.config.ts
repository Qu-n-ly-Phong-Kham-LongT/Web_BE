import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import ENV from './environment.config';

const pool = new Pool({
    connectionString: ENV.databaseUrl,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
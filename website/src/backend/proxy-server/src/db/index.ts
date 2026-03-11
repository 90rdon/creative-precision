import Redis from 'ioredis';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Legacy Supabase export (deprecated, kept for compatibility)
export const supabase = null;

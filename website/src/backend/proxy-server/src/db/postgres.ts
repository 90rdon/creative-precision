import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env'), override: false });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', { text, error });
        throw error;
    }
}

export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

export async function close() {
    await pool.end();
}

export default pool;

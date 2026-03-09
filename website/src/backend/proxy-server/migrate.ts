/**
 * migrate.ts
 * ----------
 * Runs all SQL migration files in `supabase/migrations/` against the
 * configured Supabase Postgres instance, in chronological filename order.
 *
 * Usage:
 *   cd server && npx tsx migrate.ts
 *
 * The script tries connections in this priority order:
 *   1. Pooler (us-west-1)
 *   2. Direct connection
 *   3. Pooler (us-east-1) — fallback
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env from project root (.env lives one level above server/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Database Connection Config ────────────────────────────────────────────

// Strip trailing inline comments from env values (e.g. "value # comment" → "value")
function stripComment(val: string | undefined): string {
    return (val || '').split('#')[0].trim();
}

const SUPABASE_URL = stripComment(process.env.SUPABASE_URL);
const DB_PASSWORD = stripComment(process.env.SUPABASE_DB_PASSWORD);

if (!SUPABASE_URL) {
    console.error('❌  SUPABASE_URL is not set in .env');
    process.exit(1);
}
if (!DB_PASSWORD) {
    console.error('❌  SUPABASE_DB_PASSWORD is not set in .env');
    console.error('   Add:  SUPABASE_DB_PASSWORD=<your-db-password>  to your .env file.');
    process.exit(1);
}

// Derive project ref from URL: https://<ref>.supabase.co
const match = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
if (!match) {
    console.error(`❌  Could not parse project ref from SUPABASE_URL: "${SUPABASE_URL}"`);
    process.exit(1);
}
const PROJECT_REF = match[1];

console.log(`🔑  Project ref: ${PROJECT_REF}`);

const connections = [
    // Session Pooler — IPv4 compatible, ideal for scripts and migrations
    {
        label: 'Session Pooler (us-west-1, port 5432)',
        config: {
            host: 'aws-0-us-west-1.pooler.supabase.com',
            port: 5432,
            database: 'postgres',
            user: `postgres.${PROJECT_REF}`,
            password: DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
    },
    {
        label: 'Session Pooler (us-east-1, port 5432)',
        config: {
            host: 'aws-0-us-east-1.pooler.supabase.com',
            port: 5432,
            database: 'postgres',
            user: `postgres.${PROJECT_REF}`,
            password: DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
    },
    // Transaction Pooler — fallback (may not support all DDL statements)
    {
        label: 'Transaction Pooler (us-west-1, port 6543)',
        config: {
            host: 'aws-0-us-west-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            user: `postgres.${PROJECT_REF}`,
            password: DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
    },
    // Direct — IPv6 only, will fail on most Mac/home networks
    {
        label: 'Direct (IPv6 only)',
        config: {
            host: `db.${PROJECT_REF}.supabase.co`,
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
    },
];

// ─── Migration Runner ────────────────────────────────────────────────────────

const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

function getMigrationFiles(): string[] {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    }
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort(); // Chronological order by filename prefix (YYYYMMDD...)
}

async function runMigrations(client: Client): Promise<void> {
    const files = getMigrationFiles();
    console.log(`\nFound ${files.length} migration file(s):`);
    files.forEach((f) => console.log(`  → ${f}`));

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        console.log(`\nRunning: ${file} ...`);
        await client.query(sql);
        console.log(`  ✅ ${file} applied.`);
    }
}

async function migrate(): Promise<void> {
    for (const conn of connections) {
        const client = new Client(conn.config as any);
        try {
            console.log(`\n🔌 Attempting connection via ${conn.label}...`);
            await client.connect();
            console.log(`   Connected.`);

            await runMigrations(client);

            console.log(`\n🎉 All migrations applied successfully via ${conn.label}.\n`);
            await client.end();
            return; // Success — stop trying other connections
        } catch (err: any) {
            console.warn(`   ⚠️  ${conn.label} failed: ${err.message}`);
            try { await client.end(); } catch (_) { }
        }
    }

    console.error('\n❌ All connection attempts failed. Check your .env and Supabase credentials.\n');
    process.exit(1);
}

migrate();

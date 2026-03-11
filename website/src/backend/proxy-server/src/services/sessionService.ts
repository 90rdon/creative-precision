import { redis, pool } from '../db';

export async function archiveQuietSession(sessionId: string) {
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) return;

    try {
        const session = JSON.parse(sessionData);

        // Archive to Postgres
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO assessment_sessions (id, session_status, transcript, updated_at, created_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (id) DO UPDATE SET
                   transcript = $3,
                   session_status = $2,
                   updated_at = NOW()`,
                [sessionId, 'quiet', JSON.stringify(session.history || [])]
            );
            console.log(`[Tier 2] Successfully archived session ${sessionId} to Postgres`);
        } finally {
            client.release();
        }

        // Optionally delete from redis if purely cold
        // await redis.del(`session:${sessionId}`);
    } catch (err) {
        console.error(`Failed to archive quiet session ${sessionId}:`, err);
    }
}

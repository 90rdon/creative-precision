import { redis, supabase } from '../db';

export async function archiveQuietSession(sessionId: string) {
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) return;

    try {
        const session = JSON.parse(sessionData);

        // Move to supabase if configure
        if (supabase) {
            const { error } = await supabase.from('assessment_sessions').upsert({
                id: sessionId,
                transcript: session.history || [],
                status: 'quiet',
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error("Supabase archival error:", error.message, error.details);
            } else {
                console.log(`[Tier 2] Successfully archived session ${sessionId} to Supabase`);
            }
        }

        // Optionally delete from redis if purely cold
        // await redis.del(`session:${sessionId}`);
    } catch (err) {
        console.error(`Failed to archive quiet session ${sessionId}:`, err);
    }
}

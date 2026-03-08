import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Supabase Assessment Sessions table...");
    const { data, error } = await supabase.from('assessment_sessions').select('*').limit(1);
    if (error) {
        console.error("Error connecting to assessment_sessions:", error.message);
    } else {
        console.log("Successfully connected to assessment_sessions!", data);
    }

    console.log("Testing Supabase Assessment Events table...");
    const { data: eventData, error: eventError } = await supabase.from('assessment_events').select('*').limit(1);
    if (eventError) {
        console.error("Error connecting to assessment_events:", eventError.message);
    } else {
        console.log("Successfully connected to assessment_events!", eventData);
    }
}
test();

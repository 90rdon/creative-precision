import { supabase } from './telemetry';

const command = process.argv[2];

async function main() {
    if (command === 'fetch-sessions') {
        const hours = parseInt(process.argv[3] || '24', 10);
        const date = new Date();
        date.setHours(date.getHours() - hours);

        const { data, error } = await supabase
            .from('assessment_events')
            .select('*')
            .gte('created_at', date.toISOString());

        if (error) {
            console.error(JSON.stringify({ error: error.message }));
            process.exit(1);
        }
        console.log(JSON.stringify(data, null, 2));

    } else if (command === 'fetch-insights') {
        const hours = parseInt(process.argv[3] || '24', 10);
        const date = new Date();
        date.setHours(date.getHours() - hours);

        const { data, error } = await supabase
            .from('executive_insights')
            .select('*')
            .gte('created_at', date.toISOString());

        if (error) {
            console.error(JSON.stringify({ error: error.message }));
            process.exit(1);
        }
        console.log(JSON.stringify(data, null, 2));

    } else if (command === 'log-market-signal') {
        // Usage: node gtm_tools.ts log-market-signal <topic> <strength 1-10> <insight> <implication> <url?>
        const topic = process.argv[3];
        const signalStrength = parseInt(process.argv[4] || '5', 10);
        const keyInsight = process.argv[5];
        const strategicImplication = process.argv[6];
        const sourceUrl = process.argv[7];

        if (!topic || !keyInsight || !strategicImplication) {
            console.error("Usage: tsx gtm_tools.ts log-market-signal <topic> <strength(1-10)> <insight> <implication> [url]");
            process.exit(1);
        }

        const { error } = await supabase.from('market_signals').insert([{
            topic,
            signal_strength: signalStrength,
            key_insight: keyInsight,
            strategic_implication: strategicImplication,
            ...(sourceUrl ? { source_url: sourceUrl } : {})
        }]);

        if (error) {
            console.error(JSON.stringify({ error: error.message }));
            process.exit(1);
        }
        console.log(JSON.stringify({ success: true, message: `Market signal for '${topic}' logged successfully.` }));

    } else {
        console.log(`Available commands:
  tsx gtm_tools.ts fetch-sessions [hours_ago]
  tsx gtm_tools.ts fetch-insights [hours_ago]
  tsx gtm_tools.ts log-market-signal <topic> <strength(1-10)> <insight> <implication> [url]
    `);
    }
}

main();

import { supabase } from './telemetry';
// Concept file for the OpenClaw Daily Report Generator

export async function generateDailyGTMReport() {
    // 1. Fetch sessions from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: insights, error: insightsError } = await supabase
        .from('executive_insights')
        .select('*')
        .gte('created_at', yesterday.toISOString());

    // 2. Fetch external signals
    const { data: signals, error: signalsError } = await supabase
        .from('market_signals')
        .select('*')
        .gte('created_at', yesterday.toISOString());

    if (insightsError || signalsError) {
        console.error("Failed to fetch data for report");
        return;
    }

    // 3. (In a real scenario) Send these exact JSON arrays to OpenClaw's Strategy Brain
    // to prompt it to output a synthesized markdown report.
    console.log("Found insights from sessions:", insights?.length);
    console.log("Found market sentiment signals:", signals?.length);

    console.log("[Simulation] Forwarding raw intelligence to OpenClaw...");
    // const reportMarkdown = await openclaw.synthesize(insights, signals);

    console.log("Report generated. It should be written out to a file for human approval: e.g., docs/GTM_REPORT_2026-03-02.md");
}

export async function storeAutomatedMarketResearch(topic: string, keyInsight: string) {
    // OpenClaw triggers this tool periodically to update internal context
    await supabase.from('market_signals').insert([{
        topic,
        key_insight: keyInsight,
        signal_strength: 8,
        strategic_implication: "Context automatically ingested by openclaw tools."
    }]);
    console.log(`OpenClaw stored market research signal on topic: ${topic}`);
}

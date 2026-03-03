import { supabase } from './telemetry';
import * as fs from 'fs';
import * as path from 'path';

const command = process.argv[2];

async function logAgentChange(tier: 1 | 2, title: string, reason: string, diff: string) {
    console.log(`[Engineer] Logging Tier ${tier} change: ${title}`);

    const { error } = await supabase.from('agent_changes').insert([{
        tier,
        title,
        reasoning: reason,
        proposed_diff: diff,
        status: tier === 1 ? 'pending_approval' : 'applied_automatically',
        created_at: new Date().toISOString()
    }]);

    if (error) {
        console.error("[Engineer] Failed to log change to Supabase:", error);
        process.exit(1);
    }

    console.log(`[Engineer] Successfully logged to DB. Status: ${tier === 1 ? 'pending' : 'applied'}`);

    if (tier === 1) {
        console.log(`[Tier 1] Alerting Administrator via Telegram... (simulated via API plugin)`);
        // The exact telegram call might use the openclaw messaging features, 
        // but we can just ask the OpenClaw agent to print a message to the channel or call its chat interface
        console.log(JSON.stringify({
            success: true,
            message: "DB Updated. Ensure you alert the Telegram channel for Tier 1 manual review."
        }));
    } else {
        console.log(JSON.stringify({
            success: true,
            message: "DB Updated. Minor change auto-applied."
        }));
    }
}

async function main() {
    if (command === 'propose-change') {
        const tierStr = process.argv[3];
        const title = process.argv[4];
        const reasoning = process.argv[5];
        const diffFileName = process.argv[6];

        if (!tierStr || !title || !reasoning) {
            console.error("Usage: tsx engineer_tools.ts propose-change <1|2> <title> <reasoning> [diff_file_path]");
            process.exit(1);
        }

        const tier = parseInt(tierStr, 10) as 1 | 2;
        let diff = "No diff provided";
        if (diffFileName) {
            diff = fs.readFileSync(path.resolve(process.cwd(), diffFileName), 'utf-8');
        }

        await logAgentChange(tier, title, reasoning, diff);

    } else {
        console.log(`Available commands:
  tsx engineer_tools.ts propose-change <1|2> <title> <reasoning> [diff_file_path]`);
    }
}

main();

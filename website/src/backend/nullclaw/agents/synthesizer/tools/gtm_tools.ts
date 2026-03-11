/**
 * GTM Tools
 *
 * Tools used by the Synthesizer Agent to pull telemetry, executive insights,
 * and market signals from Postgres for analysis and synthesis.
 */

import { Pool } from 'pg';

/**
 * Fetch assessment sessions and events from the last N hours
 */
export async function fetchSessions(hours: number): Promise<{
  success: boolean;
  sessions: any[];
  events: any[];
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Fetch sessions
    const sessionsResult = await pool.query(`
      SELECT * FROM assessment_sessions
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [cutoffTime]);

    // Fetch events
    const eventsResult = await pool.query(`
      SELECT * FROM assessment_events
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [cutoffTime]);

    return {
      success: true,
      sessions: sessionsResult.rows,
      events: eventsResult.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      sessions: [],
      events: [],
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Fetch executive insights from the last N hours
 */
export async function fetchInsights(hours: number): Promise<{
  success: boolean;
  insights: any[];
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const result = await pool.query(`
      SELECT * FROM executive_insights
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [cutoffTime]);

    return {
      success: true,
      insights: result.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      insights: [],
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Fetch simulator jobs from the last N hours
 */
export async function fetchSimulatorJobs(hours: number): Promise<{
  success: boolean;
  jobs: any[];
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const result = await pool.query(`
      SELECT * FROM simulator_jobs
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [cutoffTime]);

    return {
      success: true,
      jobs: result.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      jobs: [],
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Log a market signal to Postgres
 */
export async function logMarketSignal(options: {
  topic: string;
  strength: number; // 1-10
  key_insight: string;
  strategic_implication: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    await pool.query(`
      INSERT INTO market_signals (topic, strength, key_insight, strategic_implication, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (topic) DO UPDATE SET
        strength = EXCLUDED.strength,
        key_insight = EXCLUDED.key_insight,
        strategic_implication = EXCLUDED.strategic_implication,
        updated_at = NOW()
    `, [options.topic, options.strength, options.key_insight, options.strategic_implication]);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Fetch learning state for synthesis analysis
 */
export async function fetchLearningState(): Promise<{
  weakness_vector: Record<string, number>;
  tested_scenarios: string[];
  iteration_count: number;
  success: boolean;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const result = await pool.query(
      'SELECT * FROM learning_state ORDER BY updated_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return {
        weakness_vector: {},
        tested_scenarios: [],
        iteration_count: 0,
        success: true,
      };
    }

    const row = result.rows[0];
    return {
      weakness_vector: row.weakness_vector || {},
      tested_scenarios: row.tested_scenarios || [],
      iteration_count: row.iteration_count || 0,
      success: true,
    };
  } catch (error: any) {
    return {
      weakness_vector: {},
      tested_scenarios: [],
      iteration_count: 0,
      success: false,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Write synthesizer report to workspace
 */
export async function writeReport(content: string): Promise<{
  success: boolean;
  path: string;
  error?: string;
}> {
  const { writeFileSync } = require('fs');
  const path = '/nullclaw-data/workspace-synthesizer/SYNTHESIZER_REPORT.md';

  try {
    writeFileSync(path, content, 'utf-8');
    return { success: true, path };
  } catch (error: any) {
    return {
      success: false,
      path,
      error: error.message,
    };
  }
}

/**
 * Update intelligence cycle with synthesizer summary
 */
export async function updateIntelligenceCycle(summary: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    // Get or create latest cycle
    const result = await pool.query(`
      SELECT id FROM intelligence_cycles
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      await pool.query(`
        INSERT INTO intelligence_cycles (synthesizer_summary, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
      `, [summary]);
    } else {
      await pool.query(`
        UPDATE intelligence_cycles
        SET synthesizer_summary = $1, updated_at = NOW()
        WHERE id = $2
      `, [summary, result.rows[0].id]);
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Get drop-off patterns by stage
 */
export async function getDropOffPatterns(hours: number): Promise<{
  patterns: Record<string, { count: number; rate: number }>;
  success: boolean;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const result = await pool.query(`
      SELECT
        COALESCE(last_stage, 'unknown') as stage,
        COUNT(*) as count
      FROM assessment_sessions
      WHERE created_at >= $1
      GROUP BY last_stage
      ORDER BY count DESC
    `, [cutoffTime]);

    const total = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
    const patterns: Record<string, { count: number; rate: number }> = {};

    for (const row of result.rows) {
      patterns[row.stage] = {
        count: parseInt(row.count),
        rate: total > 0 ? (parseInt(row.count) / total) * 100 : 0,
      };
    }

    return { patterns, success: true };
  } catch (error: any) {
    return { patterns: {}, success: false };
  } finally {
    await pool.end();
  }
}

// CLI entry point for tool invocation
const args = process.argv.slice(2);
const [command, ...params] = args;

async function main() {
  switch (command) {
    case 'fetch-sessions':
      const sessions = await fetchSessions(parseInt(params[0]) || 12);
      console.log(JSON.stringify(sessions, null, 2));
      break;

    case 'fetch-insights':
      const insights = await fetchInsights(parseInt(params[0]) || 12);
      console.log(JSON.stringify(insights, null, 2));
      break;

    case 'fetch-simulator-jobs':
      const jobs = await fetchSimulatorJobs(parseInt(params[0]) || 12);
      console.log(JSON.stringify(jobs, null, 2));
      break;

    case 'log-market-signal':
      await logMarketSignal({
        topic: params[0],
        strength: parseInt(params[1]) || 5,
        key_insight: params[2] || '',
        strategic_implication: params[3] || '',
      });
      console.log('Market signal logged');
      break;

    case 'write-report':
      const reportContent = params[0] || 'Empty report';
      const report = await writeReport(reportContent);
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'update-cycle':
      await updateIntelligenceCycle(params[0] || '');
      console.log('Intelligence cycle updated');
      break;

    case 'dropoff-patterns':
      const patterns = await getDropOffPatterns(parseInt(params[0]) || 24);
      console.log(JSON.stringify(patterns, null, 2));
      break;

    default:
      console.error('Unknown command:', command);
      console.log('Available commands: fetch-sessions, fetch-insights, log-market-signal, write-report, update-cycle, dropoff-patterns');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default {
  fetchSessions,
  fetchInsights,
  logMarketSignal,
  writeReport,
  updateIntelligenceCycle,
  getDropOffPatterns,
  fetchSimulatorJobs,
  fetchLearningState,
};

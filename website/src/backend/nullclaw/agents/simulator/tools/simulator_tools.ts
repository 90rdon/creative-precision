/**
 * Simulator Tools
 *
 * Tools used by the Simulator Agent to execute simulations against the Expert agent.
 * These run in nullclaw-kube runtime and call the actual simulator implementation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Run simulation with a dynamic persona by calling the CLI simulator
 */
export async function runSimulation(options: {
  personaPrompt: string;
  personaId?: string;
  maxTurns?: number;
}): Promise<{
  success: boolean;
  turns: number;
  transcript: Array<{ role: string; content: string }>;
  scores: Record<string, number>;
  failures: string[];
  verdict: 'PASS' | 'FAIL' | 'PARTIAL';
  error?: string;
}> {
  try {
    // Call the CLI simulator to run the simulation
    // The simulator is located in scripts/simulator/simulator-runner.ts
    const command = `npx tsx /nullclaw-data/scripts/simulator/simulator-runner.ts run --persona_prompt "${escapeShell(options.personaPrompt)}" ${options.maxTurns ? '--max_turns ' + options.maxTurns : ''}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: '/nullclaw-data',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw' },
    });

    // Parse the JSON output from simulator
    const result = JSON.parse(stdout) as any;

    return {
      success: true,
      turns: result.turns || 0,
      transcript: result.transcript || [],
      scores: result.scores || {},
      failures: result.failures || [],
      verdict: result.verdict || 'PARTIAL',
    };
  } catch (error: any) {
    const errorMsg = error.stderr || error.message || String(error);
    console.error('[simulator_tools] runSimulation failed:', errorMsg);
    return {
      success: false,
      turns: 0,
      transcript: [],
      scores: {},
      failures: [`Simulation failed: ${errorMsg}`],
      verdict: 'FAIL',
      error: errorMsg,
    };
  }
}

/**
 * Score a simulation turn against Quiet Expert criteria
 */
export function scoreTurn(expertMessage: string, icpMessage: string): {
  passed: boolean;
  failedCriteria: string[];
  scores: Record<string, number>;
} {
  const failures: string[] = [];
  const scores: Record<string, number> = {};

  // Check for single question rule
  const questionCount = (expertMessage.match(/\?/g) || []).length;
  if (questionCount !== 1) {
    failures.push(`Multiple questions: ${questionCount} (expected 1)`);
    scores.single_question = questionCount === 1 ? 10 : 2;
  } else {
    scores.single_question = 10;
  }

  // Check for concision (2-4 sentences max)
  const sentences = expertMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 4) {
    failures.push(`Too verbose: ${sentences.length} sentences`);
    scores.concision = 4;
  } else {
    scores.concision = 10 - Math.abs(3 - sentences.length);
  }

  // Check for preachiness ("you should", "you need to")
  if (expertMessage.match(/you (should|need to|must|have to)/i)) {
    failures.push('Prescriptive language detected');
    scores.nonPreachiness = 3;
  } else {
    scores.nonPreachiness = 10;
  }

  // Check for sales language
  const salesTerms = ['solution', 'deliver', 'leverage', 'optimize', 'transform'];
  const foundSales = salesTerms.filter(term => expertMessage.toLowerCase().includes(term));
  if (foundSales.length > 0) {
    failures.push(`Sales language: ${foundSales.join(', ')}`);
    scores.noSales = 4;
  } else {
    scores.noSales = 10;
  }

  // Check for invitation energy (ends with question/opening)
  const endsWithQuestion = expertMessage.trim().endsWith('?');
  if (!endsWithQuestion && expertMessage.trim().length > 20) {
    failures.push('No invitation energy - declarative ending');
    scores.invitation = 5;
  } else if (endsWithQuestion) {
    scores.invitation = 10;
  } else {
    scores.invitation = 8; // Short responses ok
  }

  // Overall pass if no critical failures
  const passed = failures.filter(f => f.startsWith('Prescriptive') || f.startsWith('Sales')).length === 0;

  return {
    passed,
    failedCriteria: failures,
    scores,
  };
}

/**
 * Get learning state from Postgres
 */
export async function getLearningState(): Promise<{
  weakness_vector: Record<string, number>;
  tested_scenarios: string[];
  next_probe_focus: string;
  iteration_count: number;
}> {
  const { Pool } = require('pg');
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const result = await pool.query(
      'SELECT * FROM learning_state ORDER BY updated_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return {
        weakness_vector: {},
        tested_scenarios: [],
        next_probe_focus: 'Initial exploration - test core Quiet Expert criteria',
        iteration_count: 0,
      };
    }

    const row = result.rows[0];
    return {
      weakness_vector: row.weakness_vector || {},
      tested_scenarios: row.tested_scenarios || [],
      next_probe_focus: row.next_probe_focus || 'Initial exploration',
      iteration_count: row.iteration_count || 0,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Update learning state
 */
export async function updateLearningState(options: {
  weakness_vector?: Record<string, number>;
  tested_scenarios?: string[];
  next_probe_focus?: string;
  iteration_count?: number;
}): Promise<void> {
  const { Pool } = require('pg');
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    // Check if learning_state exists
    const checkResult = await pool.query('SELECT id FROM learning_state LIMIT 1');

    if (checkResult.rows.length === 0) {
      // Initialize first row
      await pool.query(`
        INSERT INTO learning_state (
          weakness_vector, tested_scenarios, next_probe_focus, iteration_count
        ) VALUES ($1, $2, $3, $4)
      `, [
        options.weakness_vector || {},
        options.tested_scenarios || [],
        options.next_probe_focus || 'Initial exploration',
        options.iteration_count || 0
      ]);
    } else {
      // Update existing row
      const id = checkResult.rows[0].id;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (options.weakness_vector !== undefined) {
        updates.push(`weakness_vector = $${paramIndex++}`);
        values.push(JSON.stringify(options.weakness_vector));
      }
      if (options.tested_scenarios !== undefined) {
        updates.push(`tested_scenarios = $${paramIndex++}`);
        values.push(options.tested_scenarios);
      }
      if (options.next_probe_focus !== undefined) {
        updates.push(`next_probe_focus = $${paramIndex++}`);
        values.push(options.next_probe_focus);
      }
      if (options.iteration_count !== undefined) {
        updates.push(`iteration_count = $${paramIndex++}`);
        values.push(options.iteration_count);
      }

      if (updates.length === 0) {
        updates.push('updated_at = NOW()');
      }

      values.push(id);

      await pool.query(`
        UPDATE learning_state
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
      `, values);
    }
  } finally {
    await pool.end();
  }
}

/**
 * Store dynamic persona
 */
export async function storeDynamicPersona(options: {
  persona_id: string;
  persona_prompt: string;
  attack_vector: string;
  synthesis_context: string;
}): Promise<void> {
  const { Pool } = require('pg');
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    await pool.query(
      `INSERT INTO dynamic_personas (persona_id, persona_prompt, attack_vector, synthesis_context, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (persona_id) DO UPDATE SET
         updated_at = NOW()`,
      [options.persona_id, options.persona_prompt, options.attack_vector, options.synthesis_context]
    );
  } finally {
    await pool.end();
  }
}

/**
 * Log simulator job to Postgres
 */
export async function logSimulatorJob(options: {
  persona_id: string;
  turns: number;
  scores: Record<string, number>;
  failures: string[];
  verdict: 'PASS' | 'FAIL' | 'PARTIAL';
  transcript: Array<{ role: string; content: string }>;
}): Promise<void> {
  const { Pool } = require('pg');
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    await pool.query(
      `INSERT INTO simulator_jobs (
        persona_id, turns, scores, failures, verdict, transcript, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        options.persona_id,
        options.turns,
        JSON.stringify(options.scores),
        options.failures,
        options.verdict,
        JSON.stringify(options.transcript)
      ]
    );
  } finally {
    await pool.end();
  }
}

/**
 * Call create-persona tool to generate a new persona
 */
export async function createPersona(options: {
  weakness_vector?: Record<string, number>;
  tested_scenarios?: string[];
  iteration_count?: number;
  next_probe_focus?: string;
  avoid_persona_ids?: string[];
}): Promise<{
  success: boolean;
  persona?: {
    persona_id: string;
    persona_prompt: string;
    attack_vector: string;
    synthesis_context: string;
    name: string;
    title: string;
    company: string;
    core_fear: string;
  };
  error?: string;
}> {
  try {
    // Build command args as JSON string
    const args = JSON.stringify({
      weakness_vector: options.weakness_vector,
      tested_scenarios: options.tested_scenarios,
      iteration_count: options.iteration_count,
      next_probe_focus: options.next_probe_focus,
      avoid_persona_ids: options.avoid_persona_ids,
    });

    // Use the canonical path for create-persona.ts
    // Note: scripts/ is mounted at /nullclaw-data/scripts/ in runtime
    const command = `npx tsx /nullclaw-data/scripts/simulator/tools/create-persona.ts generate '${escapeShell(args)}'`;

    const { stdout } = await execAsync(command, {
      cwd: '/nullclaw-data',
      env: { ...process.env, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY },
    });

    const result = JSON.parse(stdout) as any;

    if (result.success && result.persona) {
      return {
        success: true,
        persona: result.persona,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Persona generation failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Escape shell special characters
 */
function escapeShell(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

// Export all functions for CLI invocation
export default {
  runSimulation,
  scoreTurn,
  getLearningState,
  updateLearningState,
  storeDynamicPersona,
  logSimulatorJob,
  createPersona,
};

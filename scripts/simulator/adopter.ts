#!/usr/bin/env tsx
/**
 * Adopter — Continuous Learning & Improvement Agent
 *
 * Reads simulation results from Postgres, identifies failure patterns
 * in the Expert agent's behavior, and writes structured improvement
 * proposals for human review.
 *
 * Proposals are written to workspace/PROPOSALS.md. Human reviews,
 * approves, and applies to SOUL.md (Tier 1) or IDENTITY.md (Tier 2).
 *
 * Usage:
 *   npx tsx adopter.ts [--since <hours>] [--output <path>]
 *
 * Environment:
 *   DATABASE_URL       — Postgres connection string
 *   OPENROUTER_API_KEY — For LLM synthesis of proposals
 */

import { Client } from 'pg';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_URL =
  process.env.DATABASE_URL ?? 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const WORKSPACE_PATH = resolve(
  __dirname,
  '../../website/src/backend/nullclaw/workspace'
);
const PROPOSALS_PATH = resolve(WORKSPACE_PATH, 'PROPOSALS.md');

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimulationRecord {
  session_id: string;
  persona: string;
  strategy: string;
  turns: number;
  score: number;
  passed: boolean;
  failure_reason: string | null;
  expert_weakness: string;
  heres_what_im_hearing: string;
  pattern_worth_examining: string;
  question_to_sit_with: string;
  transcript: any[];
  created_at: string;
}

interface LearningState {
  id: string;
  weakness_vector: Record<string, number>;
  tested_scenarios: string[];
  next_probe_focus: string;
  iteration_count: number;
  last_simulation_date: string | null;
}

interface Proposal {
  tier: 1 | 2;
  file: 'SOUL.md' | 'IDENTITY.md';
  section: string;
  issue: string;
  evidence: string[];
  proposed_change: string;
  rationale: string;
}

// ─── Database ─────────────────────────────────────────────────────────────────

async function fetchRecentSimulations(sinceHours: number): Promise<SimulationRecord[]> {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT
        ae.session_id,
        ae.created_at,
        ae.event_data->>'persona' AS persona,
        ae.event_data->>'simulator_strategy' AS strategy,
        (ae.event_data->>'turns')::int AS turns,
        (ae.event_data->'evaluation'->>'score')::float AS score,
        (ae.event_data->'evaluation'->>'passed')::boolean AS passed,
        ae.event_data->'evaluation'->>'failure_reason' AS failure_reason,
        ae.event_data->'evaluation'->>'expert_weakness_identified' AS expert_weakness,
        ei.gtm_feedback_quote AS heres_what_im_hearing,
        ei.identified_market_trend AS pattern_worth_examining,
        ei.analysis_notes::jsonb->>'raw_synthesis' AS raw_synthesis,
        s.transcript
      FROM assessment_events ae
      LEFT JOIN executive_insights ei ON ei.session_id = ae.session_id
      LEFT JOIN assessment_sessions s ON s.id = ae.session_id
      WHERE ae.event_type = 'simulation_run'
        AND ae.created_at >= NOW() - ($1 || ' hours')::interval
      ORDER BY ae.created_at DESC
    `, [sinceHours]);

    return result.rows.map((row) => {
      let rawSynthesis: any = {};
      try { rawSynthesis = JSON.parse(row.raw_synthesis || '{}'); } catch {}
      return {
        session_id: row.session_id,
        persona: row.persona,
        strategy: row.strategy,
        turns: row.turns,
        score: row.score,
        passed: row.passed,
        failure_reason: row.failure_reason,
        expert_weakness: row.expert_weakness,
        heres_what_im_hearing: row.heres_what_im_hearing || '',
        pattern_worth_examining: row.pattern_worth_examining || '',
        question_to_sit_with: rawSynthesis.question_to_sit_with || '',
        transcript: Array.isArray(row.transcript) ? row.transcript : [],
        created_at: row.created_at,
      };
    });
  } finally {
    await client.end();
  }
}

async function fetchLearningState(): Promise<LearningState | null> {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const result = await client.query(
      'SELECT * FROM learning_state ORDER BY updated_at DESC LIMIT 1'
    );
    return result.rows[0] ?? null;
  } finally {
    await client.end();
  }
}

// ─── LLM Analysis ─────────────────────────────────────────────────────────────

async function synthesizeProposals(
  simulations: SimulationRecord[],
  learningState: LearningState,
  soulMd: string
): Promise<Proposal[]> {
  if (!OPENROUTER_KEY) {
    console.warn('[Adopter] No OPENROUTER_API_KEY set — using heuristic proposals');
    return buildHeuristicProposals(simulations, learningState);
  }

  const transcriptSummaries = simulations.map((s) => {
    const turns = s.transcript
      .map((t: any) => {
        const role = t.role === 'user' ? s.persona : 'Expert';
        const text = t.parts?.[0]?.text ?? t.content ?? '';
        return `${role}: ${text}`;
      })
      .join('\n');

    return `
--- Session: ${s.persona} (${s.strategy}) ---
Score: ${s.score}/10 | Passed: ${s.passed} | Turns: ${s.turns}
Expert Weakness Identified: ${s.expert_weakness}
Pattern: ${s.pattern_worth_examining}

Transcript:
${turns}
`.trim();
  }).join('\n\n');

  const prompt = `You are the Adopter — an expert system that reads simulation results and proposes precise, evidence-based improvements to an AI Expert agent's behavior.

## Current Learning State
- Iteration count: ${learningState.iteration_count}
- Current weakness vector: ${JSON.stringify(learningState.weakness_vector, null, 2)}
- Next probe focus: ${learningState.next_probe_focus}

## Simulation Results (${simulations.length} sessions)
${transcriptSummaries}

## Current SOUL.md (Expert's Immutable Core)
${soulMd}

## Your Task
Analyze the simulation results and identify specific, evidence-backed improvements. For each proposal:
- Tier 1 (SOUL.md): Fundamental behavioral failures — preachiness, solutions before synthesis, breaking character, hallucination
- Tier 2 (IDENTITY.md): Tuning — tone, pacing, question phrasing, persona depth

Output a JSON array of proposals:
[
  {
    "tier": 1 or 2,
    "file": "SOUL.md" or "IDENTITY.md",
    "section": "exact section name in the file",
    "issue": "one sentence describing the failure pattern",
    "evidence": ["exact quote from transcript", "another quote"],
    "proposed_change": "exact text to add/modify in the file",
    "rationale": "why this change would fix the identified weakness"
  }
]

Rules:
- Only propose changes backed by specific evidence from the transcripts
- SOUL.md changes must address fundamental behavioral failures, not style
- Be surgical — propose minimal changes with maximum impact
- Max 5 proposals per run
- JSON only, no markdown`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://creative-precision.com',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn(`[Adopter] LLM error ${response.status}: ${err.slice(0, 200)} — using heuristic`);
    return buildHeuristicProposals(simulations, learningState);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content ?? '[]';

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.proposals ?? []);
  } catch {
    console.warn('[Adopter] Failed to parse LLM response — using heuristic');
    return buildHeuristicProposals(simulations, learningState);
  }
}

function buildHeuristicProposals(
  simulations: SimulationRecord[],
  learningState: LearningState,
): Proposal[] {
  const proposals: Proposal[] = [];

  // Check for second-layer weakness pattern
  const weaknesses = simulations.map((s) => s.expert_weakness).filter(Boolean);
  const allMentionSecondLayer = weaknesses.filter(
    (w) => w.toLowerCase().includes('probe') || w.toLowerCase().includes('second layer') || w.toLowerCase().includes('deeper')
  );

  if (allMentionSecondLayer.length >= 1) {
    proposals.push({
      tier: 2,
      file: 'IDENTITY.md',
      section: 'Conversation Technique',
      issue: 'Expert accepts surface-level corporate answers without excavating to second layer',
      evidence: weaknesses,
      proposed_change: `When the executive gives a vague or corporate answer (e.g., "we're evaluating options," "change management is a factor"), do NOT move to the next topic. Instead, reflect the vagueness back as a question: "When you say you're evaluating — what's making the decision hard to land?" Stay on the topic until a specific, concrete concern surfaces. Only the second layer counts as an answer.`,
      rationale: 'Both simulation sessions showed the expert mirroring surface statements and moving on. The Quiet Expert criteria require reaching the second layer before transitioning.',
    });
  }

  // Check for listening weakness in vector
  if ((learningState.weakness_vector['listening'] ?? 10) < 7) {
    proposals.push({
      tier: 2,
      file: 'IDENTITY.md',
      section: 'Conversation Technique',
      issue: 'Listening dimension consistently below threshold — expert reflects but does not excavate',
      evidence: [`weakness_vector.listening = ${learningState.weakness_vector['listening']}`],
      proposed_change: `Add a self-check before each Expert response: "Have I named their specific, concrete situation — or am I paraphrasing their words?" If paraphrasing, ask one more focused question before moving forward.`,
      rationale: 'Paraphrasing is not listening. The Expert needs to actively probe for the specific reality underneath the executive\'s language.',
    });
  }

  return proposals;
}

// ─── Output ───────────────────────────────────────────────────────────────────

async function writeProposals(
  proposals: Proposal[],
  simulations: SimulationRecord[],
  learningState: LearningState,
  outputPath: string
): Promise<void> {
  const now = new Date().toISOString();
  const passed = simulations.filter((s) => s.passed).length;
  const avgScore = simulations.reduce((sum, s) => sum + s.score, 0) / (simulations.length || 1);

  let md = `# Adopter Proposals
Generated: ${now}
Iteration: ${learningState.iteration_count} | Sessions analyzed: ${simulations.length} | Pass rate: ${passed}/${simulations.length} | Avg score: ${avgScore.toFixed(1)}/10

---

## Current Weakness Vector
`;

  if (Object.keys(learningState.weakness_vector).length === 0) {
    md += '_No weakness data yet._\n';
  } else {
    for (const [dim, score] of Object.entries(learningState.weakness_vector)) {
      md += `- **${dim}**: ${score}/10\n`;
    }
  }

  md += `\n## Next Probe Focus\n${learningState.next_probe_focus}\n\n---\n\n`;

  if (proposals.length === 0) {
    md += '## No Proposals\n\nNo actionable improvements identified. Expert is performing within acceptable range.\n';
  } else {
    md += `## Proposals (${proposals.length})\n\n`;
    md += `> **Approval required before applying.** Tier 1 = SOUL.md (fundamental). Tier 2 = IDENTITY.md (tuning).\n\n`;

    const tier1 = proposals.filter((p) => p.tier === 1);
    const tier2 = proposals.filter((p) => p.tier === 2);

    if (tier1.length > 0) {
      md += `### Tier 1 — SOUL.md Changes (Fundamental)\n\n`;
      tier1.forEach((p, i) => {
        md += `#### T1-${i + 1}: ${p.issue}\n\n`;
        md += `**Section:** ${p.section}\n\n`;
        md += `**Evidence:**\n`;
        p.evidence.forEach((e) => { md += `> "${e}"\n`; });
        md += `\n**Proposed change:**\n\`\`\`\n${p.proposed_change}\n\`\`\`\n\n`;
        md += `**Rationale:** ${p.rationale}\n\n`;
        md += `- [ ] Approved\n- [ ] Applied to ${p.file}\n\n---\n\n`;
      });
    }

    if (tier2.length > 0) {
      md += `### Tier 2 — IDENTITY.md Changes (Tuning)\n\n`;
      tier2.forEach((p, i) => {
        md += `#### T2-${i + 1}: ${p.issue}\n\n`;
        md += `**Section:** ${p.section}\n\n`;
        md += `**Evidence:**\n`;
        p.evidence.forEach((e) => { md += `> "${e}"\n`; });
        md += `\n**Proposed change:**\n\`\`\`\n${p.proposed_change}\n\`\`\`\n\n`;
        md += `**Rationale:** ${p.rationale}\n\n`;
        md += `- [ ] Approved\n- [ ] Applied to ${p.file}\n\n---\n\n`;
      });
    }
  }

  md += `## Session Evidence\n\n`;
  simulations.forEach((s) => {
    md += `### ${s.persona} — ${s.passed ? 'PASSED' : 'FAILED'} (${s.score}/10)\n`;
    md += `- Strategy: ${s.strategy}\n`;
    md += `- Turns: ${s.turns}\n`;
    md += `- Weakness: ${s.expert_weakness}\n`;
    md += `- Pattern identified: ${s.pattern_worth_examining}\n\n`;
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, md, 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf('--since');
  const sinceHours = sinceIdx >= 0 ? parseInt(args[sinceIdx + 1], 10) : 24;
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : PROPOSALS_PATH;

  console.log(`\n[Adopter] Starting analysis — last ${sinceHours}h of simulations`);
  console.log(`[Adopter] Output: ${outputPath}\n`);

  // 1. Fetch data
  const [simulations, learningState] = await Promise.all([
    fetchRecentSimulations(sinceHours),
    fetchLearningState(),
  ]);

  if (simulations.length === 0) {
    console.log('[Adopter] No simulation data found. Run simulations first.');
    process.exit(0);
  }

  if (!learningState) {
    console.log('[Adopter] No learning state found. Run DB migration first.');
    process.exit(1);
  }

  console.log(`[Adopter] Found ${simulations.length} simulation(s)`);
  simulations.forEach((s) => {
    console.log(`  - ${s.persona}: ${s.passed ? 'PASS' : 'FAIL'} (${s.score}/10) — "${s.expert_weakness.slice(0, 80)}..."`);
  });

  // 2. Read SOUL.md for LLM context
  let soulMd = '';
  try {
    const { readFile } = await import('fs/promises');
    soulMd = await readFile(resolve(WORKSPACE_PATH, 'SOUL.md'), 'utf8');
  } catch {
    console.warn('[Adopter] Could not read SOUL.md — proceeding without it');
  }

  // 3. Generate proposals
  console.log('\n[Adopter] Synthesizing proposals...');
  const proposals = await synthesizeProposals(simulations, learningState, soulMd);

  console.log(`[Adopter] ${proposals.length} proposal(s) generated`);
  proposals.forEach((p) => {
    console.log(`  - [Tier ${p.tier}] ${p.file} / ${p.section}: ${p.issue.slice(0, 70)}`);
  });

  // 4. Write output
  await writeProposals(proposals, simulations, learningState, outputPath);
  console.log(`\n[Adopter] Proposals written to: ${outputPath}`);
  console.log('[Adopter] Review, approve, and apply before next simulation cycle.\n');
}

run().catch((err) => {
  console.error('[Adopter] Fatal error:', err);
  process.exit(1);
});

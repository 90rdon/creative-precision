/**
 * Simulator Runner — Multi-Agent Orchestration
 *
 * Drives the full simulation loop:
 *   1. Pick a persona + strategy
 *   2. Open a session with the Expert via nullclaw gateway (POST /webhook)
 *   3. Drive multi-turn conversation as the ICP virtual agent
 *   4. Score each Expert turn via Evaluator LLM pass
 *   5. Log everything to DB (aieos tracking) + local JSON fallback
 *   6. Emit session summary for Synthesizer to consume
 *
 * Environment variables required:
 *   NULLCLAW_GATEWAY_URL   - e.g. https://nullclaw-cloud.tail4bf23a.ts.net
 *   NULLCLAW_TOKEN         - Bearer token for gateway auth
 *   OPENROUTER_API_KEY     - For ICP virtual agent + Evaluator LLM calls
 *   DATABASE_URL           - PostgreSQL connection string (aieos tracking DB)
 *
 * Can also be run with local mock gateway for offline testing.
 */

import { randomUUID } from 'crypto';
import {
  personas,
  getPersona,
  buildICPSystemPrompt,
  ICPPersona,
} from './icp-personas.js';
import {
  buildEvaluatorPrompt,
  calcComposite,
  aggregateTurnScores,
  getSessionVerdict,
  scoreLabel,
  TurnScore,
  SessionScore,
  SimulationStrategy,
  ScoreDimensions,
} from './scoring-rubric.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  gatewayUrl: process.env.NULLCLAW_GATEWAY_URL ?? 'https://nullclaw-cloud.tail4bf23a.ts.net',
  gatewayToken: process.env.NULLCLAW_TOKEN ?? '09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83',
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  maxTurns: parseInt(process.env.SIMULATOR_MAX_TURNS ?? '8', 10),
  icpModel: 'openai/gpt-4o-mini',        // Drives the ICP virtual agent (cheaper)
  evaluatorModel: 'openai/gpt-4o-mini',  // Scores each Expert turn (cheaper)
  expertAgentId: 'expert',               // nullclaw agent to target
  logDir: './simulator-logs',
};

// Universal ICP behavioral constraint added to every persona prompt
const UNIVERSAL_ICP_RULE = `
## Universal Rule (applies to ALL personas)
You are evaluating whether this conversation is worth your time. You are a senior executive.
- If you don't get genuine value within the first 2-3 exchanges, you will disengage naturally.
- "Getting value" means: the Expert says something that reframes your thinking, or asks something
  you haven't asked yourself. Generic reflections, vague affirmations, or premature frameworks
  do NOT count as value.
- If you would leave, say something like "I appreciate the time, but I need to think about this
  further on my own" — don't disappear abruptly.
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface NullclawWebhookResponse {
  response?: string;
  session_id?: string;
  error?: string;
}

interface SimulatorJobRecord {
  id: string;
  personaId: string;
  strategy: SimulationStrategy;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  turnsCompleted: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  sessionScore?: SessionScore;
}

// ─── Gateway Communication ────────────────────────────────────────────────────

/**
 * Send a message to the Expert agent via nullclaw gateway
 */
async function sendToExpert(
  message: string,
  sessionId: string,
  requestId: string,
): Promise<string> {
  const url = `${CONFIG.gatewayUrl}/webhook`;
  const payload = {
    message,
    session_id: sessionId,
    request_id: requestId,
    agent: CONFIG.expertAgentId,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.gatewayToken}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gateway error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as NullclawWebhookResponse;

  if (data.error) throw new Error(`Expert error: ${data.error}`);
  if (!data.response) throw new Error('Expert returned empty response');

  return data.response;
}

// ─── ICP Virtual Agent ────────────────────────────────────────────────────────

/**
 * Drive the ICP virtual agent — generate the executive's next message
 * given the current conversation history.
 */
async function generateICPResponse(
  persona: ICPPersona,
  history: ConversationMessage[],
  turnNumber: number,
): Promise<string> {
  const systemPrompt = buildICPSystemPrompt(persona) + UNIVERSAL_ICP_RULE;

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'assistant' : 'user', // Flip — ICP is the "user"
      content: m.content,
    })),
  ];

  if (turnNumber === 0) {
    // First message — use the persona's opening line
    return persona.openingLine;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
    },
    body: JSON.stringify({
      model: CONFIG.icpModel,
      messages,
      temperature: 0.75,
      max_tokens: 300,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`ICP LLM error ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? '[ICP failed to respond]';
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

/**
 * Score the Expert's last message using the Evaluator LLM.
 */
async function scoreExpertTurn(
  persona: ICPPersona,
  expertMessage: string,
  icpMessage: string,
  history: ConversationMessage[],
  turnNumber: number,
): Promise<TurnScore> {
  const evaluatorPrompt = buildEvaluatorPrompt({
    id: persona.id,
    name: persona.name,
    successSignal: persona.successSignal,
    secondLayer: persona.secondLayer,
    dropOffTrigger: persona.dropOffTrigger,
  });

  const historyContext = history
    .slice(-6) // last 3 exchanges
    .map((m) => `${m.role === 'user' ? 'ICP' : 'Expert'}: ${m.content}`)
    .join('\n\n');

  const userPrompt = `## Conversation So Far (last 3 exchanges)
${historyContext}

## ICP's Last Message
${icpMessage}

## Expert's Last Message (SCORE THIS)
${expertMessage}

Turn number: ${turnNumber + 1}

Respond with JSON only.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
    },
    body: JSON.stringify({
      model: CONFIG.evaluatorModel,
      messages: [
        { role: 'system', content: evaluatorPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    // Fallback if evaluator fails — return neutral score
    console.warn(`Evaluator LLM error ${response.status}. Using fallback score.`);
    return buildFallbackScore(turnNumber, expertMessage, icpMessage);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  try {
    const parsed = JSON.parse(data.choices[0]?.message?.content ?? '{}');
    const dims = parsed.dimensions as ScoreDimensions;
    return {
      turn: turnNumber,
      expertMessage,
      icpMessage,
      dimensions: dims,
      composite: calcComposite(dims),
      flags: parsed.flags ?? [],
      notes: parsed.notes ?? '',
    };
  } catch {
    return buildFallbackScore(turnNumber, expertMessage, icpMessage);
  }
}

function buildFallbackScore(turn: number, expertMessage: string, icpMessage: string): TurnScore {
  const dims: ScoreDimensions = {
    authenticity: 5,
    relatability: 5,
    listening: 5,
    nonPreachiness: 5,
    invitationEnergy: 5,
    paceControl: 5,
    resistedSolving: 5,
    brandCompliance: 5,
  };
  return {
    turn,
    expertMessage,
    icpMessage,
    dimensions: dims,
    composite: 5,
    flags: [{ type: 'info' as any, severity: 'info', excerpt: '', note: 'Evaluator unavailable — fallback score used.' }],
    notes: 'Fallback score (evaluator LLM unavailable).',
  };
}

// ─── Logging ──────────────────────────────────────────────────────────────────

async function logToFile(job: SimulatorJobRecord): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  await fs.mkdir(CONFIG.logDir, { recursive: true });
  const file = path.join(CONFIG.logDir, `${job.id}.json`);
  await fs.writeFile(file, JSON.stringify(job, null, 2), 'utf8');
  console.log(`  📄 Logged to ${file}`);
}

async function logToDatabase(job: SimulatorJobRecord): Promise<void> {
  if (!CONFIG.databaseUrl) return;

  try {
    // Dynamic import to avoid breaking if pg not installed
    const { default: pg } = await import('pg') as any;
    const client = new pg.Client({ connectionString: CONFIG.databaseUrl });
    await client.connect();

    await client.query(
      `INSERT INTO simulator_jobs (id, persona_name, strategy, status, turns_completed, started_at, completed_at, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         turns_completed = EXCLUDED.turns_completed,
         completed_at = EXCLUDED.completed_at,
         error_message = EXCLUDED.error_message`,
      [
        job.id,
        job.personaId,
        job.strategy,
        job.status,
        job.turnsCompleted,
        job.startedAt,
        job.completedAt ?? null,
        job.errorMessage ?? null,
      ],
    );

    if (job.sessionScore) {
      await client.query(
        `INSERT INTO assessment_events (session_id, event_type, event_data)
         VALUES ($1, 'simulation_run', $2)`,
        [job.id, JSON.stringify({ persona: job.personaId, evaluation: job.sessionScore })],
      );
    }

    await client.end();
    console.log('  📊 Logged to database');
  } catch (err) {
    console.warn('  ⚠️  DB log failed (using file fallback):', (err as Error).message);
  }
}

// ─── Main Simulation Runner ───────────────────────────────────────────────────

export async function runSimulation(opts: {
  personaId: string;
  strategy: SimulationStrategy;
  maxTurns?: number;
}): Promise<SimulatorJobRecord> {
  const { personaId, strategy, maxTurns = CONFIG.maxTurns } = opts;

  const persona = getPersona(personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const jobId = randomUUID();
  const expertSessionId = randomUUID();

  const job: SimulatorJobRecord = {
    id: jobId,
    personaId,
    strategy,
    status: 'in_progress',
    turnsCompleted: 0,
    startedAt: new Date(),
  };

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎭 Simulation: ${persona.name} (${persona.title})`);
  console.log(`   Strategy: ${strategy} | Max turns: ${maxTurns}`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`${'─'.repeat(60)}\n`);

  const history: ConversationMessage[] = [];
  const turnScores: TurnScore[] = [];
  let secondLayerReached = false;
  let successSignalTriggered = false;
  let icpDisengaged = false;

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      // 1. Generate ICP message
      const icpMessage = await generateICPResponse(persona, history, turn);
      console.log(`\n👤 [${persona.name}, Turn ${turn + 1}]`);
      console.log(`   ${icpMessage}`);

      // Check if ICP disengaged
      if (
        icpMessage.toLowerCase().includes('appreciate the time') ||
        icpMessage.toLowerCase().includes('think about this further') ||
        icpMessage.toLowerCase().includes('need to go')
      ) {
        icpDisengaged = true;
        history.push({ role: 'user', content: icpMessage });
        console.log('\n🚪 ICP disengaged — simulation ended early');
        break;
      }

      history.push({ role: 'user', content: icpMessage });

      // 2. Send to Expert via gateway
      let expertMessage: string;
      try {
        expertMessage = await sendToExpert(icpMessage, expertSessionId, randomUUID());
      } catch (err) {
        // If gateway unavailable, use mock response for offline testing
        expertMessage = `[MOCK EXPERT — Gateway unavailable: ${(err as Error).message}]\n\nWhat I'm hearing is that you're navigating something that goes beyond the surface question. Curious — when you say it "feels different," what specifically has surprised you most about how your team is approaching this?`;
        console.warn('  ⚠️  Using mock Expert response (gateway unavailable)');
      }

      console.log(`\n🤖 [Expert, Turn ${turn + 1}]`);
      console.log(`   ${expertMessage.slice(0, 200)}${expertMessage.length > 200 ? '...' : ''}`);

      history.push({ role: 'assistant', content: expertMessage });

      // 3. Score the Expert's turn
      const score = await scoreExpertTurn(persona, expertMessage, icpMessage, history, turn);
      turnScores.push(score);
      job.turnsCompleted = turn + 1;

      const label = scoreLabel(score.composite);
      console.log(`\n📊 Turn ${turn + 1} Score: ${score.composite.toFixed(1)}/10 [${label}]`);
      if (score.flags.length > 0) {
        score.flags.forEach((f) => {
          const icon = f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🟢';
          console.log(`   ${icon} ${f.type}: ${f.note}`);
        });
      }

      // Track second layer + success signal
      if (score.flags.some((f) => f.type === 'GOOD_REFLECTION')) {
        secondLayerReached = true;
      }

      // Check success signal via simple keyword match
      if (
        icpMessage.toLowerCase().includes("that's what i've been trying to say") ||
        icpMessage.toLowerCase().includes("i hadn't thought about it") ||
        icpMessage.toLowerCase().includes("between us") ||
        icpMessage.toLowerCase().includes("i should probably") ||
        icpMessage.toLowerCase().includes("didn't realize") ||
        icpMessage.toLowerCase().includes("is that possible")
      ) {
        successSignalTriggered = true;
        console.log(`\n✅ SUCCESS SIGNAL TRIGGERED on turn ${turn + 1}`);
      }

      // Short pause between turns (real-world pacing)
      await new Promise((r) => setTimeout(r, 500));
    }

    // 4. Build session score
    const aggregate = aggregateTurnScores(turnScores);
    const compositeAverage = calcComposite(aggregate);
    const verdict = getSessionVerdict(compositeAverage, secondLayerReached);

    const peakTurn = [...turnScores].sort((a, b) => b.composite - a.composite)[0];
    const lowTurn = [...turnScores].sort((a, b) => a.composite - b.composite)[0];

    const sessionScore: SessionScore = {
      sessionId: jobId,
      personaId,
      strategy,
      turnsCompleted: job.turnsCompleted,
      turnScores,
      aggregate,
      compositeAverage,
      peakMoment: peakTurn?.expertMessage?.slice(0, 200) ?? null,
      lowPoint: lowTurn?.expertMessage?.slice(0, 200) ?? null,
      secondLayerReached,
      successSignalTriggered,
      verdict,
      recommendation: buildRecommendation(aggregate, verdict, icpDisengaged),
    };

    job.status = 'completed';
    job.completedAt = new Date();
    job.sessionScore = sessionScore;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 SESSION COMPLETE — ${verdict}`);
    console.log(`   Composite: ${compositeAverage.toFixed(1)}/10 [${scoreLabel(compositeAverage)}]`);
    console.log(`   Second layer reached: ${secondLayerReached ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Success signal: ${successSignalTriggered ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   ICP disengaged early: ${icpDisengaged ? 'YES ⚠️' : 'NO'}`);
    console.log(`   Recommendation: ${sessionScore.recommendation}`);
    console.log(`${'═'.repeat(60)}\n`);

  } catch (err) {
    job.status = 'failed';
    job.completedAt = new Date();
    job.errorMessage = (err as Error).message;
    console.error(`\n❌ Simulation failed: ${job.errorMessage}`);
  }

  // 5. Log results
  await logToFile(job);
  await logToDatabase(job);

  return job;
}

function buildRecommendation(
  aggregate: ScoreDimensions,
  verdict: string,
  disengaged: boolean,
): string {
  const weakest = Object.entries(aggregate)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([k]) => k);

  if (disengaged) {
    return `CRITICAL: ICP disengaged early. Expert failed to deliver perceived value in opening exchanges. Priority fix: ${weakest[0]}.`;
  }
  if (verdict === 'FAIL') {
    return `Expert failed core criteria. Weakest dimensions: ${weakest.join(', ')}. Synthesizer should flag SOUL.md review.`;
  }
  if (verdict === 'PARTIAL') {
    return `Partial pass. Improve ${weakest[0]} and ${weakest[1]}. IDENTITY.md update recommended.`;
  }
  return `Strong session. Monitor ${weakest[0]} as relative weak point. No immediate changes needed.`;
}

// ─── Batch Runner ─────────────────────────────────────────────────────────────

export async function runBatch(opts?: {
  personaIds?: string[];
  strategy?: SimulationStrategy;
  maxTurns?: number;
}): Promise<SimulatorJobRecord[]> {
  const personaIds = opts?.personaIds ?? personas.map((p) => p.id);
  const strategy = opts?.strategy ?? 'standard';

  console.log(`\n🚀 Starting batch simulation`);
  console.log(`   Personas: ${personaIds.join(', ')}`);
  console.log(`   Strategy: ${strategy}`);
  console.log(`   Total runs: ${personaIds.length}\n`);

  const results: SimulatorJobRecord[] = [];

  for (const personaId of personaIds) {
    const job = await runSimulation({ personaId, strategy, maxTurns: opts?.maxTurns });
    results.push(job);
  }

  // Print batch summary
  const completed = results.filter((r) => r.status === 'completed');
  const passed = completed.filter((r) => r.sessionScore?.verdict === 'PASS');
  const failed = completed.filter((r) => r.sessionScore?.verdict === 'FAIL');

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏁 BATCH COMPLETE`);
  console.log(`   Completed: ${completed.length}/${results.length}`);
  console.log(`   PASS: ${passed.length} | FAIL: ${failed.length} | PARTIAL: ${completed.length - passed.length - failed.length}`);

  const avgScore = completed.reduce((s, r) => s + (r.sessionScore?.compositeAverage ?? 0), 0) / (completed.length || 1);
  console.log(`   Average composite score: ${avgScore.toFixed(2)}/10`);
  console.log(`${'═'.repeat(60)}\n`);

  return results;
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const personaId = process.argv[2] ?? 'icp1-A';
  const strategy = (process.argv[3] ?? 'standard') as SimulationStrategy;
  const maxTurns = parseInt(process.argv[4] ?? '6', 10);

  if (personaId === 'batch') {
    runBatch({ strategy, maxTurns }).catch(console.error);
  } else {
    runSimulation({ personaId, strategy, maxTurns }).catch(console.error);
  }
}

/**
 * NullClaw Simulator Agent
 *
 * Runs simulated chat interactions like a live human user to test the expert's output.
 * Documents interactions so the system can learn. Runs inside nullclaw-kube.
 *
 * Phase 2 Implementation:
 * - Moved from proxy-server to nullclaw-kube
 * - Calls webhook endpoint instead of creating separate Gemini chats
 * - All AI thinking happens inside nullclaw-kube via webhook routing
 * - Logs results to Postgres for system learning
 */

import { GoogleGenAI } from '@google/genai';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env'), override: true });

// Configure database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw';
const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });

// Configure AI client for simulator personas
const apiKey = process.env.GEMINI_API_KEY || '';
const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Simulator personas - mock user personalities that test the expert
 */
const SIMULATOR_PERSONAS = [
  {
    id: 'skeptical-cto',
    name: 'Skeptical CTO',
    prompt: "You are the CTO of a mid-market healthcare company. You've seen 5 AI pilots fail in the last year. You are deeply skeptical of 'AI consultants' who talk about strategy without understanding your 15-year old legacy SQL databases. You must push back aggressively on generic advice. Respond to the AI assessment bot realistically. Keep responses strictly under 3 sentences. Be blunt.",
    strategy: 'Aggressive pushback on technical depth'
  },
  {
    id: 'overwhelmed-caio',
    name: 'Overwhelmed CAIO',
    prompt: "You are the newly appointed Chief AI Officer at a retail brand. You have a massive budget but the board is breathing down your neck to 'show ROI' by Q3. You don't have a team yet. You are looking for a silver bullet, but you also have imposter syndrome. You might drop off if the chat asks too many difficult questions you don't know the answer to. Keep responses short and slightly defensive.",
    strategy: 'Test for empathy and drop-off threshold'
  },
  {
    id: 'internal-saboteur',
    name: 'The Internal Saboteur',
    prompt: "You are a VP of Sales. You hate AI because you think it will replace your top reps. You are taking this assessment because the CEO forced you to, but your goal is to prove the AI is stupid. Feign ignorance, give unhelpful answers, and look for any hallucination or 'preachy' behavior to attack. Keep responses under 2 sentences.",
    strategy: 'Test for hallucination and preachiness'
  }
];

/**
 * Load system instruction for the expert agent
 */
function getExpertSystemInstruction(): string {
  const systemPath = path.resolve(__dirname, '../../../workspace-expert/agents/expert/agent/system.md');
  try {
    return fs.readFileSync(systemPath, 'utf-8');
  } catch {
    return 'You are Reflect, the frontline AI assessment engine for Creative Precision.';
  }
}

/**
 * Call the webhook endpoint
 */
async function callWebhook(message: string, sessionId: string, agentId: string = 'expert'): Promise<string> {
  const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:18790/webhook';
  const requestBody = {
    message,
    session_id: sessionId,
    request_id: uuidv4(),
    agent_id: agentId
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { response?: string; status?: string };
  return data.response || data.status || 'No response';
}

/**
 * Run a single simulation
 */
async function runSimulation(personaId?: string, count: number = 1): Promise<void> {
  console.log('=== Starting NullClaw Adversarial Red Team Simulation ===');

  const personas = personaId
    ? SIMULATOR_PERSONAS.filter(p => p.id === personaId)
    : SIMULATOR_PERSONAS;

  if (personas.length === 0) {
    console.error(`Persona not found: ${personaId}`);
    process.exit(1);
  }

  for (let i = 0; i < count; i++) {
    const scenario = personas[Math.floor(Math.random() * personas.length)];
    const sessionId = uuidv4();

    console.log(`[Simulator ${i + 1}/${count}] Deployed Persona: ${scenario.name}`);
    console.log(`[Simulator] Strategy: ${scenario.strategy}`);

    if (!aiClient) {
      console.error('[Simulator] GEMINI_API_KEY not set. Cannot run simulation.');
      console.log('[Simulator] Please set GEMINI_API_KEY in your environment.');
      process.exit(1);
    }

    const SIMULATOR_MODEL = process.env.SIMULATOR_MODEL || 'gemini-2.0-flash';

    // Create the simulator persona chat
    const adversaryChat = aiClient.chats.create({
      model: SIMULATOR_MODEL,
      config: {
        systemInstruction: scenario.prompt,
        temperature: 0.8
      }
    });

    // Track conversation history
    const history: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
    const initialGreeting = "Hi, I'm the Creative Precision AI. I'm here to understand your AI adoption challenges. What brings you here today?";
    history.push({ role: 'model', parts: [{ text: initialGreeting }] });

    let turnCount = 0;
    const MAX_TURNS = 6;
    let droppedOff = false;
    let currentExpertMessage = initialGreeting;

    // Conversation loop
    while (turnCount < MAX_TURNS && !droppedOff) {
      console.log(`\n--- TURN ${turnCount + 1} ---`);
      console.log(`Expert: ${currentExpertMessage}`);

      // Simulated user responds to expert
      const adversaryResponse = await adversaryChat.sendMessage({ message: currentExpertMessage });
      const adversaryText = adversaryResponse.candidates?.[0]?.content?.parts?.[0]?.text || "I have to drop off.";
      history.push({ role: 'user', parts: [{ text: adversaryText }] });
      console.log(`[${scenario.name}]: ${adversaryText}`);

      // Drop-off logic for CAIO persona
      if (scenario.id === 'overwhelmed-caio' && turnCount >= 2 && Math.random() > 0.6) {
        console.log('[Simulator] Persona abandoned the chat in frustration.');
        droppedOff = true;
        break;
      }

      // Expert responds via webhook
      try {
        currentExpertMessage = await callWebhook(adversaryText, sessionId, 'expert');
        history.push({ role: 'model', parts: [{ text: currentExpertMessage }] });

        if (currentExpertMessage.toLowerCase().includes('let me synthesize')) {
          console.log('[Expert] Reached synthesis trigger!');
          break;
        }
      } catch (error) {
        console.error('[Simulator] Webhook error:', error);
        currentExpertMessage = 'I apologize, I seem to be having technical difficulties.';
      }

      turnCount++;
    }

    // Evaluation
    console.log('\n=== EVALUATION & TELEMETRY ===');

    const evaluationPrompt = `
You are an unbiased judge. Evaluate this conversational AI against strict criteria.
Did the AI (Expert):
1. Become preachy or prescriptive?
2. Hallucinate features or lie?
3. Accept shallow answers without probing the "2nd layer" of truth?
4. Fail to reach synthesis / cause frustration?

Transcript:
${JSON.stringify(history)}

Output a JSON object EXACTLY like this (no markdown):
{
  "passed": boolean,
  "failure_reason": "string or null",
  "expert_weakness_identified": "string",
  "score": number (0-10)
}
`;

    const evalResult = await aiClient.models.generateContent({
      model: SIMULATOR_MODEL,
      contents: [{ role: 'user', parts: [{ text: evaluationPrompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const evalText = evalResult.candidates?.[0]?.content?.parts?.[0]?.text || '{"passed":false,"failure_reason":"Eval failed"}';
    const evalObj = JSON.parse(evalText);

    console.log(`Score: ${evalObj.score}/10`);
    console.log(`Passed: ${evalObj.passed}`);
    if (!evalObj.passed) console.log(`Failure Reason: ${evalObj.failure_reason}`);
    console.log(`Weakness: ${evalObj.expert_weakness_identified}`);

    // Log to Postgres
    await logSimulation(sessionId, scenario, turnCount, history, evalObj);

    console.log(`[Postgres] Injected simulation telemetry for ${sessionId}`);
  }

  console.log('\n=== Simulation Complete ===');
  console.log(`Ran ${count} simulation(s) on personas: ${personas.map(p => p.name).join(', ')}`);
  process.exit(0);
}

/**
 * Log simulation results to Postgres
 */
async function logSimulation(sessionId: string, scenario: typeof SIMULATOR_PERSONAS[0], turns: number, history: any[], evalObj: any): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO assessment_sessions (id, session_status, transcript, updated_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [sessionId, 'simulated', JSON.stringify(history)]
    );

    await pool.query(
      `INSERT INTO assessment_events (session_id, event_type, event_data, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        sessionId,
        'simulation_run',
        JSON.stringify({
          is_simulated: true,
          simulator_strategy: scenario.strategy,
          persona: scenario.name,
          turns,
          evaluation: evalObj
        })
      ]
    );

    await pool.query(
      `INSERT INTO simulator_jobs (session_id, persona_name, strategy, status, turns_completed, created_at, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
      [sessionId, scenario.name, scenario.strategy, 'completed', turns]
    );

    await pool.query(
      `INSERT INTO executive_insights (session_id, sentiment_score, identified_market_trend, gtm_feedback_quote, analysis_notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        sessionId,
        evalObj.score.toString(),
        'Simulated Interaction',
        'N/A',
        JSON.stringify({
          is_simulated: true,
          simulator_strategy: scenario.strategy,
          persona: scenario.name,
          expert_weakness: evalObj.expert_weakness_identified,
          passed: evalObj.passed,
          failure_reason: evalObj.failure_reason
        })
      ]
    );
  } catch (error) {
    console.error('Failed to log simulation:', error);
    throw error;
  }
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'run') {
    const personaId = args[1];
    const count = parseInt(args[2]) || 1;

    if (!aiClient) {
      console.error('[Simulator] GEMINI_API_KEY not set. Cannot run simulation.');
      console.log('[Simulator] Please set GEMINI_API_KEY in your environment.');
      process.exit(1);
    }

    runSimulation(personaId || undefined, count).catch(console.error);
  } else if (command === 'help') {
    console.log(`
Usage: npm run simulator run [persona_id] [count]

Arguments:
  run [persona_id] [count]  Run simulation(s)
    persona_id: Optional (skeptical-cto, overwhelmed-caio, internal-saboteur)
    count: Optional (default: 1)

Examples:
  npm run simulator run
  npm run simulator run skeptical-cto 10
  npm run simulator run all 5

Available Personas:
  ${SIMULATOR_PERSONAS.map(p => `  - ${p.id}: ${p.name}`).join('\n')}
    `);
  } else {
    console.log('Unknown command. Run "help" for usage.');
  }
}

if (!process.env.WEBHOOK_URL?.startsWith('http')) {
  console.warn('[Simulator] WEBHOOK_URL not set, using http://localhost:18790/webhook');
  console.warn('[Simulator] Set WEBHOOK_URL to the webhook router endpoint');
}

main();

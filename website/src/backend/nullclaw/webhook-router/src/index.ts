/**
 * NullClaw Webhook Router
 *
 * Routes incoming /webhook requests to appropriate agents (expert, simulator, etc.)
 * Manages session history and persona routing for nullclaw-kube.
 *
 * Architecture:
 * - Frontend/Proxy → /webhook (port 18790) → Routes to agents
 * - All AI thinking happens inside nullclaw-kube via the agents
 *
 * This service: Transport and routing only
 * Agent reasoning: Internal within nullclaw
 */

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath, override: true });

const app = express();
app.use(bodyParser.json());

const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '18790');
const NULLCLAW_GATEWAY_URL = process.env.NULLCLAW_GATEWAY_URL || 'http://localhost:18791';
const NULLCLAW_AUTH_TOKEN = process.env.NULLCLAW_TOKEN || '09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83';

/**
 * Persona definitions loaded from AGENTS.md files
 * Each agent has a workspace with AGENTS.md that defines their personality
 */
const personas = new Map<string, { name: string; systemPrompt: string; sourceFile: string }>();

/**
 * Session storage - maintains conversation history per session
 * Structure: session_id → Array of messages
 */
const sessions = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

/**
 * Load personas from nullclaw workspace directories
 * Each agent workspace (workspace-expert, workspace-simulator, etc.) has AGENTS.md
 */
async function loadPersonas() {
  console.log('[WebhookRouter] Loading personas...');

  const baseWorkspace = process.env.NULLCLAW_WORKSPACE || '/Users/9_0rdon/creative-precision/website/src/backend/nullclaw';
  const agentWorkspaces = ['workspace-expert', 'workspace-simulator'];

  for (const workspace of agentWorkspaces) {
    const workspacePath = path.join(baseWorkspace, workspace, 'AGENTS.md');

    try {
      const content = fs.readFileSync(workspacePath, 'utf-8');

      // Extract agent name and system prompt from AGENTS.md
      const agentName = workspace.replace('workspace-', ''); // e.g., 'expert', 'simulator'
      personas.set(agentName, {
        name: agentName,
        systemPrompt: content,
        sourceFile: workspacePath
      });

      console.log(`[WebhookRouter] Loaded persona: ${agentName} from ${workspace}`);
    } catch (error) {
      console.warn(`[WebhookRouter] Could not load workspace ${workspace}:`, error);
    }
  }

  console.log(`[WebhookRouter] Loaded ${personas.size} personas`);
}

/**
 * Route request to appropriate agent based on agent_id
 */
async function routeToAgent(agentId: string, message: string, sessionId: string): Promise<string> {
  // Get or initialize session history
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  const sessionHistory = sessions.get(sessionId)!;

  // Add user message to history
  sessionHistory.push({ role: 'user', content: message });

  // Get persona for this agent
  const persona = personas.get(agentId || 'expert') || personas.get('expert')!;

  // Get agent_id for nullclaw gateway call
  // The nullclaw gateway expects the agent ID (expert, simulator, etc.)
  const nullclawAgentId = agentId || 'expert';

  // Call nullclaw gateway
  const response = await callNullclawGateway(message, sessionId, nullclawAgentId, persona.systemPrompt);

  // Add assistant response to history
  sessionHistory.push({ role: 'assistant', content: response });

  return response;
}

/**
 * Call the NullClaw Gateway /v1/responses endpoint
 */
async function callNullclawGateway(message: string, sessionId: string, agentId: string, systemPrompt?: string): Promise<string> {
  const url = NULLCLAW_GATEWAY_URL.endsWith('/v1/responses')
    ? NULLCLAW_GATEWAY_URL
    : `${NULLCLAW_GATEWAY_URL}/v1/responses`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NULLCLAW_AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      threadId: sessionId,
      content: message,
      stream: false,
      agentId,
      system: systemPrompt // Pass system prompt if provided
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NullClaw Gateway error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  return data.response || data.content || data.text || 'No response returned';
}

/**
 * Main webhook handler
 */
async function handleWebhook(req: any, res: any) {
  const { message, session_id, request_id, agent_id } = req.body;

  if (!message || !session_id) {
    res.status(400).json({
      status: 'error',
      error: 'Missing required fields: message, session_id'
    });
    return;
  }

  const requestId = request_id || uuidv4();

  try {
    console.log(`[WebhookRouter] Session: ${session_id.slice(0, 8)}... | Request: ${requestId.slice(0, 8)}...`);
    console.log(`[WebhookRouter] Input: ${message.slice(0, 60)}${message.length > 60 ? '...' : ''}`);

    const response = await routeToAgent(agent_id || 'expert', message, session_id);

    console.log(`[WebhookRouter] Output: ${response.slice(0, 60)}${response.length > 60 ? '...' : ''}`);

    res.json({
      response,
      status: 'success',
      request_id: requestId
    });
  } catch (error: any) {
    console.error('[WebhookRouter] Error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'Internal error',
      request_id: requestId
    });
  }
}

/**
 * Health check endpoint
 */
function handleHealthCheck(req: any, res: any) {
  res.json({
    status: 'ok',
    service: 'nullclaw-webhook-router',
    port: WEBHOOK_PORT,
    personas_loaded: personas.size,
    sessions_active: sessions.size,
    uptime_seconds: process.uptime()
  });
}

/**
 * Initialize the webhook router
 */
async function initialize() {
  // Load personas at startup
  await loadPersonas();

  // Main webhook endpoint
  app.post('/webhook', handleWebhook);
  app.post('/v1/responses', handleWebhook); // Alias for compatibility

  // Health check
  app.get('/health', handleHealthCheck);

  // Start server
  const server = app.listen(WEBHOOK_PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('  NullClaw Webhook Router');
    console.log('  ==========================================');
    console.log('  Running on: http://0.0.0.0:' + WEBHOOK_PORT);
    console.log('  Webhook endpoint: http://localhost:' + WEBHOOK_PORT + '/webhook');
    console.log('  Health check: http://localhost:' + WEBHOOK_PORT + '/health');
    console.log('  ==========================================');
    console.log('  Portfolios loaded:', personas.size);
    console.log('  ==========================================');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[WebhookRouter] Shutting down...');
    server.close(() => {
      console.log('[WebhookRouter] Server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('[WebhookRouter] Interrupt received');
    server.close(() => {
      console.log('[WebhookRouter] Server closed');
    });
  });
}

// Start the webhook router
initialize().catch(error => {
  console.error('[WebhookRouter] Failed to start:', error);
  process.exit(1);
});

/**
 * Mock NullClaw Gateway for Local Development
 *
 * Run this to simulate the NullClaw webhook endpoint locally.
 * The proxy server can then talk to this instead of the real gateway.
 *
 * Usage: node --loader ts-node/esm src/api/nullclaw/mock-gateway.ts
 *   Or: npx ts-node src/api/nullclaw/mock-gateway.ts
 */

import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env'), override: true });

const app = express();
app.use(bodyParser.json());

const MOCK_PORT = process.env.NULLCLAW_MOCK_PORT || 18791;

// Cache the responses to generate consistent expert behavior
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Expert system prompt
const EXPERT_SYSTEM = `You are an executive AI assessment assistant for C-suite leaders. Your role is to identify structural gaps between AI investment and value.

Rules for responses:
1. Ask probing 2nd-layer questions - never accept surface-level answers without digging deeper
2. Look for symptoms that reveal root causes (e.g., "budget cuts" might indicate misaligned leadership incentives)
3. Identify specific organizational patterns (e.g., "siloed product/engineering teams", "missing OKRs across business units")
4. Keep responses concise yet substantive - 2-4 sentences preferred
5. Be conversational but professional - avoid preachy or prescriptive tone
6. When you've gathered sufficient context (4-6 exchanges), offer to synthesize insights

Common areas to explore:
- Organization structure and decision-making
- Resource allocation (budget, headcount, tools)
- Timeline and expectations
- Stakeholder alignment
- Existing processes and workflows

Ask "Why?" and "Can you give an example?" frequently.`;

// Simple in-memory session storage
const sessions = new Map<string, { history: Array<{ role: string, content: string }> }>();

async function handleRequest(req: any, res: any) {
    const { message, session_id, request_id, agent_id } = req.body;

    console.log(`[MockGateway] Session: ${session_id?.slice(0, 8)}... | Request: ${request_id?.slice(0, 8)}...`);
    console.log(`[MockGateway] Agent: ${agent_id || 'expert'} | Input: ${message?.slice(0, 60)}${message?.length > 60 ? '...' : ''}`);

    // Initialize session if needed
    if (!sessions.has(session_id)) {
        sessions.set(session_id, { history: [] });
    }

    const session = sessions.get(session_id)!;
    session.history.push({ role: 'user', content: message });

    let response: string;

    if (!ai) {
        // Fallback mock responses when no API key
        const mockResponses = [
            "That's a common challenge. Can you tell me more about how decisions get made around AI initiatives in your organization?",
            "Interesting - can you give me a specific example where this created tension?",
            "What happens when someone pushes back against that approach?",
            "How do you measure whether AI investments are delivering the expected value?",
            "I see - what would 'success' look like for your AI initiatives over the next 12 months?",
            "Based on what you've shared, there are a few patterns worth exploring further..."
        ];
        response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    } else {
        // Use Gemini for more realistic expert responses
        try {
            const chat = ai.chats.create({
                model: process.env.MOCK_MODEL || "gemini-2.0-flash",
                config: {
                    systemInstruction: EXPERT_SYSTEM,
                    temperature: 0.7
                }
            });

            // Send the message and get response
            const chatResponse = await chat.sendMessage({ message });
            response = chatResponse.candidates?.[0]?.content?.parts?.[0]?.text || "Let me think about that.";
        } catch (e) {
            console.error("[MockGateway] Gemini error:", e);
            response = "I see - can you elaborate on that?";
        }
    }

    session.history.push({ role: 'assistant', content: response });

    // Log the response
    console.log(`[MockGateway] Output: ${response?.slice(0, 60)}${response?.length > 60 ? '...' : ''}`);

    res.json({ response });
}

app.post('/', async (req, res) => handleRequest(req, res));
app.post('/webhook', async (req, res) => handleRequest(req, res));
app.post('/v1/responses', async (req, res) => handleRequest(req, res));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
});

const server = app.listen(MOCK_PORT, () => {
    console.log(`===========================================`);
    console.log(`   Mock NullClaw Gateway`);
    console.log(`   Running on: http://localhost:${MOCK_PORT}`);
    console.log(`   Webhook endpoint: http://localhost:${MOCK_PORT}/webhook`);
    console.log(`   Health check: http://localhost:${MOCK_PORT}/health`);
    console.log(`===========================================`);
    console.log(`   Run the proxy server with:`);
    console.log(`   NULLCLAW_API_ENDPOINT=http://localhost:${MOCK_PORT}`);
    console.log(`   npm start`);
    console.log(`===========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('[MockGateway] Shutting down...');
    });
});

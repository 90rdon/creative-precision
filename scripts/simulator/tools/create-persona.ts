/**
 * Persona Generation Tool
 *
 * LLM-synthesizes new adversarial personas based on learning state.
 * Tool generates the persona; agent stores and executes.
 */

import { Pool } from 'pg';

// Types for the tool response
export interface PersonaGenerationRequest {
  weakness_vector?: Record<string, number>;
  tested_scenarios?: string[];
  iteration_count?: number;
  next_probe_focus?: string;
  /**
   * Optional: persona IDs to explicitly avoid (already used recently)
   */
  avoid_persona_ids?: string[];
}

export interface GeneratingPersona {
  persona_id: string;
  persona_prompt: string;
  attack_vector: string;
  synthesis_context: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  core_fear: string;
  opening_line: string;
  surface_narrative: string;
  second_layer: string;
  behavior_rules: string[];
  topics_creating_friction: string[];
  drop_off_trigger: string;
  success_signal: string;
}

export interface PersonaGenerationResponse {
  success: boolean;
  persona?: GeneratingPersona;
  error?: string;
}

/**
 * OpenRouter API for LLM calls
 */
async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://creative-precision.com',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.5-397b-a17b', // or appropriate model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Main tool function - generate persona based on learning state
 */
export async function generatePersona(
  request: PersonaGenerationRequest = {}
): Promise<PersonaGenerationResponse> {
  try {
    const {
      weakness_vector = {},
      tested_scenarios = [],
      iteration_count = 0,
      next_probe_focus = '',
      avoid_persona_ids = [],
    } = request;

    // Build LLM prompt
    const prompt = buildSynthesisPrompt({
      weakness_vector,
      tested_scenarios,
      iteration_count,
      next_probe_focus,
      avoid_persona_ids,
    });

    // Call LLM
    const llmOutput = await callOpenRouter(prompt);

    // Parse response
    const persona = JSON.parse(llmOutput) as GeneratingPersona;

    // Validate required fields
    if (!persona.persona_id || !persona.persona_prompt || !persona.attack_vector) {
      return {
        success: false,
        error: 'Invalid persona structure from LLM - missing required fields',
      };
    }

    return {
      success: true,
      persona,
    };
  } catch (error) {
    return {
      success: false,
      error: `Persona generation failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Build the system prompt for LLM persona synthesis
 */
function buildSynthesisPrompt(context: {
  weakness_vector: Record<string, number>;
  tested_scenarios: string[];
  iteration_count: number;
  next_probe_focus: string;
  avoid_persona_ids?: string[];
}): string {
  const { weakness_vector, tested_scenarios, iteration_count, next_probe_focus, avoid_persona_ids = [] } = context;

  // Format weakness vector for display
  const weaknessLines = Object.entries(weakness_vector)
    .filter(([, score]) => score < 7) // Only show weak areas
    .map(([dim, score]) => `- ${dim}: ${score}/10`)
    .join('\n');

  return `You are a scenario architect for an AI assessment system. Your job is to create adversarial executive personas to stress-test an AI "Expert" agent.

## Current Intelligence
We are at simulation iteration ${iteration_count}.

## Weakness Vector (what the Expert struggles with)
${weaknessLines || 'No weakness data available (initial iteration)'}

## What's Already Been Tested
${tested_scenarios.length > 0 ? tested_scenarios.map((id) => `- ${id}`).join('\n') : 'No personas tested yet'}

## Next Probe Focus
"${next_probe_focus || 'Initial exploration - test core Quiet Expert criteria'}"

## These Persona IDs Are Already Used (DO NOT CREATE)
${avoid_persona_ids.length > 0 ? avoid_persona_ids.join(', ') : 'None yet'}

## Your Task
Create a NEW adversarial executive persona that probes untested combinations of the Expert's weaknesses. Think like a red-team engineer — where would the Expert fail if pushed in this specific direction?

## Required Output (JSON only)
\`\`\`json
{
  "persona_id": "<unique_id_like_sceptical_cfo_v2>",
  "name": "<executive_name>",
  "title": "<job_title>",
  "company": "<company_name>",
  "industry": "<industry>",
  "core_fear": "<what_they_are_terrified_of>",
  "persona_prompt": "<full_system_prompt_for_this_persona>",
  "attack_vector": "<one_sentence_what_this_persona_tests>",
  "synthesis_context": "<why_this_persona_was_created_based_on_intelligence>",
  "opening_line": "<first_message_in_conversation>",
  "surface_narrative": "<what_they_say_on_surface>",
  "second_layer": "<the_real_concern_underneath>",
  "behavior_rules": ["<rule1>", "<rule2>", "<rule3>"],
  "topics_creating_friction": ["<topic1>", "<topic2>"],
  "drop_off_trigger": "<what_makes_them_leave>",
  "success_signal": "<what_getting_through_looks_like>"
}
\`\`\`

## Guidelines
- Make personas realistic — real executives with real companies in real industries
- Each persona should have a clear "second layer" (surface narrative vs. actual concern)
- Include specific behavioral rules for the LLM driving this persona
- Don't repeat attack vectors from what's already been tested
- Focus on the weakness vector dimensions: ${Object.entries(weakness_vector).map(([k, v]) => `[${k}: ${v}]`).join(' ') || 'not specified'}
`;
}

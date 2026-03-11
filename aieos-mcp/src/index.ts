/**
 * AIEOS MCP Server
 *
 * Agent Intelligence and Execution Operating System — MCP server
 * that provides Claude and other MCP clients with tools to:
 *   - Register and query agent instances (nullclaw-kube, worker-pis, etc.)
 *   - List and configure personas across instances
 *   - Track simulation jobs and session events in near-real-time
 *   - Query and save agent state fragments (memory layer)
 *   - Define relationships between agents
 *
 * Storage: JSON files in ./data/ (LowDB-style, no external DB required)
 * Optionally syncs to PostgreSQL if DATABASE_URL is set.
 *
 * Start: npx tsx src/index.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Store } from './store.js';
import { NullclawGatewayClient } from './gateway.js';

// ─── MCP Server Setup ─────────────────────────────────────────────────────────

const server = new Server(
  { name: 'aieos-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

const store = new Store('./data');

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_instances',
    description: 'List all registered NullClaw/OpenClaw agent instances with their current status.',
    inputSchema: {
      type: 'object',
      properties: {
        status_filter: {
          type: 'string',
          enum: ['online', 'offline', 'degraded', 'all'],
          description: 'Filter by status. Default: all.',
        },
      },
    },
  },
  {
    name: 'get_instance_status',
    description: 'Get live status, agent health, and session count for a specific instance.',
    inputSchema: {
      type: 'object',
      properties: {
        instance_id: { type: 'string', description: 'Instance ID (e.g. nullclaw-kube)' },
      },
      required: ['instance_id'],
    },
  },
  {
    name: 'register_instance',
    description: 'Register a new NullClaw/OpenClaw instance with the AIEOS.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique instance ID' },
        type: { type: 'string', enum: ['nullclaw', 'openclaw'] },
        endpoint: { type: 'string', description: 'Gateway URL (e.g. https://nullclaw-cloud.tail...)' },
        token: { type: 'string', description: 'Bearer token for gateway auth' },
        environment: { type: 'string', description: 'e.g. production, staging, local' },
        metadata: { type: 'object', description: 'Optional: CPU, RAM, location, etc.' },
      },
      required: ['id', 'type', 'endpoint', 'token'],
    },
  },
  {
    name: 'list_personas',
    description: 'List all personas configured across instances, or for a specific instance.',
    inputSchema: {
      type: 'object',
      properties: {
        instance_id: { type: 'string', description: 'Filter by instance. Optional.' },
      },
    },
  },
  {
    name: 'configure_persona',
    description: 'Update the DNA (system prompt) or settings for a specific persona on an instance.',
    inputSchema: {
      type: 'object',
      properties: {
        instance_id: { type: 'string' },
        persona_id: { type: 'string', description: 'e.g. expert, simulator, synthesizer' },
        dna: { type: 'string', description: 'New system prompt / SOUL.md content' },
        configuration: { type: 'object', description: 'Model overrides, temperature, etc.' },
      },
      required: ['instance_id', 'persona_id'],
    },
  },
  {
    name: 'define_relationship',
    description: 'Define a relationship between two agents (e.g. simulator monitors expert).',
    inputSchema: {
      type: 'object',
      properties: {
        source_instance: { type: 'string' },
        source_agent: { type: 'string' },
        target_instance: { type: 'string' },
        target_agent: { type: 'string' },
        relationship_type: {
          type: 'string',
          enum: ['is_subagent_of', 'shares_memory_with', 'monitors', 'evaluates', 'synthesizes_from'],
        },
      },
      required: ['source_instance', 'source_agent', 'target_instance', 'target_agent', 'relationship_type'],
    },
  },
  {
    name: 'get_agent_state',
    description: 'Retrieve state fragments (memory) for an agent using keyword query.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', description: 'e.g. expert, simulator' },
        instance_id: { type: 'string' },
        query: { type: 'string', description: 'Keyword query to find relevant state' },
        limit: { type: 'number', description: 'Max results. Default 5.' },
      },
      required: ['agent_id', 'instance_id', 'query'],
    },
  },
  {
    name: 'save_agent_state',
    description: 'Persist a state fragment for an agent.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: { type: 'string' },
        instance_id: { type: 'string' },
        key: { type: 'string', description: 'State key (e.g. last_simulation_score)' },
        content: { type: 'string', description: 'State payload (text or JSON string)' },
        category: { type: 'string', description: 'e.g. simulation, score, insight' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['agent_id', 'instance_id', 'key', 'content'],
    },
  },
  {
    name: 'list_simulation_jobs',
    description: 'List recent simulation jobs with status, persona, and scores.',
    inputSchema: {
      type: 'object',
      properties: {
        status_filter: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'failed', 'all'],
          description: 'Filter by status. Default: all.',
        },
        limit: { type: 'number', description: 'Max results. Default 20.' },
      },
    },
  },
  {
    name: 'get_simulation_insights',
    description: 'Get aggregated insights from simulation runs: weak dimensions, patterns, recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        persona_id: { type: 'string', description: 'Filter to a specific persona. Optional.' },
        since_hours: { type: 'number', description: 'Look back N hours. Default 24.' },
      },
    },
  },
  {
    name: 'log_event',
    description: 'Log a custom event to the AIEOS event stream (near-real-time tracking).',
    inputSchema: {
      type: 'object',
      properties: {
        instance_id: { type: 'string' },
        agent_id: { type: 'string' },
        event_type: { type: 'string', description: 'e.g. simulation_start, score_update, synthesis_complete' },
        category: { type: 'string', enum: ['simulation', 'synthesis', 'engineering', 'monitoring', 'alert'] },
        severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
        title: { type: 'string' },
        description: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['instance_id', 'agent_id', 'event_type', 'title'],
    },
  },
  {
    name: 'get_fleet_dashboard',
    description: 'Get a real-time snapshot of the entire fleet: all instances, agents, recent events, and simulation scores.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ─── Tool Handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const input = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {

      case 'list_instances': {
        const instances = store.listInstances();
        const filtered = input.status_filter && input.status_filter !== 'all'
          ? instances.filter((i: any) => i.status === input.status_filter)
          : instances;
        return { content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }] };
      }

      case 'get_instance_status': {
        const instance = store.getInstance(input.instance_id as string);
        if (!instance) {
          return { content: [{ type: 'text', text: `Instance not found: ${input.instance_id}` }] };
        }
        // Try live health check
        let liveStatus: any = null;
        try {
          const client = new NullclawGatewayClient(instance.endpoint, instance.token);
          liveStatus = await client.healthCheck();
        } catch {
          liveStatus = { error: 'Gateway unreachable', cached_status: instance.status };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ instance, live: liveStatus }, null, 2),
          }],
        };
      }

      case 'register_instance': {
        const instance = store.upsertInstance({
          id: input.id as string,
          type: input.type as string,
          endpoint: input.endpoint as string,
          token: input.token as string,
          environment: (input.environment as string) ?? 'production',
          metadata: (input.metadata as object) ?? {},
          status: 'online',
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: `Registered: ${JSON.stringify(instance, null, 2)}` }] };
      }

      case 'list_personas': {
        const personas = store.listPersonas(input.instance_id as string | undefined);
        return { content: [{ type: 'text', text: JSON.stringify(personas, null, 2) }] };
      }

      case 'configure_persona': {
        const persona = store.upsertPersona({
          instanceId: input.instance_id as string,
          personaId: input.persona_id as string,
          name: input.persona_id as string,
          dna: input.dna as string | undefined,
          configuration: input.configuration as object | undefined,
          updatedAt: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: `Updated persona: ${JSON.stringify(persona, null, 2)}` }] };
      }

      case 'define_relationship': {
        const rel = store.defineRelationship({
          source: { instanceId: input.source_instance as string, agentId: input.source_agent as string },
          target: { instanceId: input.target_instance as string, agentId: input.target_agent as string },
          type: input.relationship_type as string,
          createdAt: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: `Relationship defined: ${JSON.stringify(rel, null, 2)}` }] };
      }

      case 'get_agent_state': {
        const fragments = store.queryState(
          input.instance_id as string,
          input.agent_id as string,
          input.query as string,
          (input.limit as number) ?? 5,
        );
        return { content: [{ type: 'text', text: JSON.stringify(fragments, null, 2) }] };
      }

      case 'save_agent_state': {
        const fragment = store.saveState({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          instanceId: input.instance_id as string,
          agentId: input.agent_id as string,
          key: input.key as string,
          content: input.content as string,
          category: (input.category as string) ?? 'general',
          tags: (input.tags as string[]) ?? [],
          createdAt: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: `Saved: ${JSON.stringify(fragment, null, 2)}` }] };
      }

      case 'list_simulation_jobs': {
        const jobs = store.listSimulationJobs(
          input.status_filter as string | undefined,
          (input.limit as number) ?? 20,
        );
        return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
      }

      case 'get_simulation_insights': {
        const insights = store.getSimulationInsights(
          input.persona_id as string | undefined,
          (input.since_hours as number) ?? 24,
        );
        return { content: [{ type: 'text', text: JSON.stringify(insights, null, 2) }] };
      }

      case 'log_event': {
        const event = store.logEvent({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          instanceId: input.instance_id as string,
          agentId: input.agent_id as string,
          eventType: input.event_type as string,
          category: (input.category as string) ?? 'monitoring',
          severity: (input.severity as string) ?? 'info',
          title: input.title as string,
          description: input.description as string | undefined,
          metadata: (input.metadata as object) ?? {},
          createdAt: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: `Logged: ${event.id}` }] };
      }

      case 'get_fleet_dashboard': {
        const dashboard = store.getFleetDashboard();
        return { content: [{ type: 'text', text: JSON.stringify(dashboard, null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error in ${name}: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  // Bootstrap default nullclaw-kube instance if not already registered
  const existing = store.getInstance('nullclaw-kube');
  if (!existing) {
    store.upsertInstance({
      id: 'nullclaw-kube',
      type: 'nullclaw',
      endpoint: 'https://nullclaw-cloud.tail4bf23a.ts.net',
      token: process.env.NULLCLAW_TOKEN ?? '09b9ddbc0845b3525a9ea2dffe4a0a87b1c94676ab791b83',
      environment: 'production',
      metadata: { location: 'kubernetes', agents: ['main', 'expert', 'synthesizer', 'engineer', 'simulator'] },
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Register default agent relationships
    const rels = [
      { src: 'simulator', tgt: 'expert', type: 'monitors' },
      { src: 'synthesizer', tgt: 'expert', type: 'synthesizes_from' },
      { src: 'synthesizer', tgt: 'simulator', type: 'synthesizes_from' },
      { src: 'engineer', tgt: 'synthesizer', type: 'is_subagent_of' },
      { src: 'main', tgt: 'expert', type: 'is_subagent_of' },
      { src: 'main', tgt: 'synthesizer', type: 'is_subagent_of' },
    ];
    for (const r of rels) {
      store.defineRelationship({
        source: { instanceId: 'nullclaw-kube', agentId: r.src },
        target: { instanceId: 'nullclaw-kube', agentId: r.tgt },
        type: r.type,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[aieos-mcp] Server running via stdio');
}

main().catch((err) => {
  console.error('[aieos-mcp] Fatal:', err);
  process.exit(1);
});

# Implementation Plan: NullClaw AIEOS MCP Server

This plan outlines the creation of an MCP server designed to manage and configure multiple NullClaw/OpenClaw instances, acting as an "Operating System" for agents.

## 1. Objectives
- **Centralized Status**: Show health, hardware details, and configuration of multiple instances.
- **Persona Management**: List and configure personas across instances.
- **Data Store & Relationships**: Define relationships between agents (parent/child/peer) and collate their states.
- **State Instantiation**: Allow agents to recover state using Serena-like vector retrieval patterns.
- **Dockerized Deployment**: Easily deployable via Docker for local use.

## 2. AIEOS Data Model (Storage: LowDB or JSON-based for local persistence)

### `AgentInstance`
- `id`: Unique identifier (e.g., `nullclaw-local`, `nullclaw-kube`).
- `type`: `nullclaw` | `openclaw`.
- `endpoint`: URL to the instance gateway.
- `token`: Auth token for the gateway.
- `metadata`: Hardware info (CPU, Memory, OS), location, environment.
- `status`: Cached health status (`online`, `offline`, `degraded`).

### `Persona` (Bound to Instance)
- `instanceId`: Reference to `AgentInstance`.
- `personaId`: e.g., `expert`, `synthesizer`.
- `name`: Display name.
- `dna`: Core system prompt/instructions.
- `configuration`: Persona-specific settings (model fallbacks, etc.).

### `Relationship`
- `source`: { type, id }
- `target`: { type, id }
- `type`: `is_subagent_of`, `shares_memory_with`, `monitors`.

### `StateFragment` (Memory)
- `id`: UUID.
- `agentId`: Reference Agent.
- `content`: State payload.
- `vectorRef`: Reference to a vector ID in a separate DB (or simulated via keywords for now).

## 3. MCP Tools (Exposed via SDK)

1.  `list_instances`: Returns all registered NullClaw/OpenClaw instances.
2.  `get_instance_status`: Fetches live status, hardware utilization, and active sessions for a specific instance.
3.  `register_instance`: Adds a new instance to the AIEOS registry.
4.  `list_personas`: Lists all personas across all instances or filtered by instance.
5.  `configure_persona`: Updates the DNA or settings of a specific persona.
6.  `define_relationship`: Creates a link between two entities (e.g., Agent A is a subagent of Agent B).
7.  `get_agent_state`: Retrieves state fragments for an agent using a query-based (vector-like) lookup.
8.  `save_agent_state`: Persists a state fragment for an agent.

## 4. Project Structure (`aieos-mcp/`)

```text
aieos-mcp/
├── src/
│   ├── index.ts          # MCP Server entry point
│   ├── types.ts          # AIEOS Schema types
│   ├── store.ts          # JSON-based persistence (LowDB)
│   ├── gateway.ts        # Client for NullClaw/OpenClaw APIs
│   └── tools/            # Tool implementation logic
├── Dockerfile            # Container definition
├── package.json          # Dependencies (@modelcontextprotocol/sdk, zod, axios, lowdb)
└── tsconfig.json         # TypeScript config
```

## 5. Phased Implementation

### Phase 1: Foundation (Core AIEOS)
- Initialize project with MCP SDK.
- Implement `register_instance` and `list_instances`.
- Implement basic `get_instance_status` (pinging a dummy or local gateway).

### Phase 2: Persona & Relationship Layer
- Implement persona discovery (reading `config.json` via Gateway or FS).
- Implement relationship mapping tools.

### Phase 3: State & Memory retrieval
- Implement the `save_agent_state` and `get_agent_state`.
- Add local keyword/vector simulation for retrieval.

### Phase 4: Docker & Integration
- Create Dockerfile.
- Provide `docker-compose.yml` to run alongside existing services.

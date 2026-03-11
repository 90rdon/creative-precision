# Feature Specification: Continuous Loop Reliability Configuration

**Feature Branch**: `008-loop-config`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User description: "how can we config nullclaw-kube to operate this reliably"

---

## Architecture Overview

### The Continuous Agent Loop

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            NULLCLAW-KUBE (Central Brain)                                 │
│  Port 18790 - All AI thinking, agent orchestration, and personality routing              │
│                                                                                          │
│  ═════ FREQUENT COLLECTION ═════                    ═════ PERIODIC SYNTHESIS ═════        │
│  (Hourly, Configurable)                         (Daily, Configurable)                     │
│                                                                                          │
│  ┌─────────────────────┐                        ┌─────────────────────┐                    │
│  │  Simulator Agent    │                        │  Synthesizer Agent │                    │
│  │  (Runs frequently  │─────── Results ────────►│  (Aggregates &     │                    │
│  │   collects data)   │  over many runs         │   Analyzes)        │                    │
│  └──────────┬───────────┘                        └──────────┬──────────┘                    │
│             │                                               │                              │
│             │ spawns test requests to Expert               │ generates insights              │
│             ▼                                               │                               │
│  ┌─────────────────────┐                        ┌─────────────────────┐                    │
│  │   Expert Agent      │                        │  Engineer Agent     │                    │
│  │   (Executive        │◄───────────────────────│   (Transforms       │                    │
│  │    Diagnostician)   │    learning & guidance │   Insights to       │                    │
│  └─────────────────────┘                        │   Code & Builds)    │                    │
│               │                                  └──────────┬──────────┘                    │
│               │ provides                                           │ deploys              │
│               │ simulation responses                              │ updated               │
│               │                                                   │ system                │
│               └───────────────────────────────────────────────────┘                      │
│                                                                                          │
│           Simulator frequency (e.g., hourly)      Synthesizer + Engineer frequency        │
│           → Multiple data points accumulated   (e.g., daily) → System updated            │
│           → Meaningful patterns emerge              → Cycle restarts                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Goal**: Configure nullclaw-kube so agents run at different frequencies — Simulator frequently collects test data, Synthesizer periodically aggregates for meaningful analysis, and Engineer transforms insights into code changes.

**Loop Flow**:

1. **Simulator** runs frequently (hourly, configurable) and accumulates multiple test results
2. **Expert** responds to each simulation request
3. **Synthesizer** runs less frequently (daily, configurable) to aggregate, analyze, and generate insights from accumulated results
4. **Engineer** consumes synthesizer insights and generates code changes and builds
5. **System** is updated with improvements, and the cycle restarts

**Key Rationale**: Individual simulator runs produce sparse data. Aggregating multiple runs before synthesis yields meaningful patterns and actionable insights. The Engineer consumes the synthesized output rather than raw simulation data.

---

## Implementation Approach

### Leverage NullClaw Capabilities

Nullclaw-kube provides the following capabilities that enable this reliable continuous loop implementation:

| Capability | How It Enables This Feature |
|------------|-------------------------------|
| **Heartbeat System** | Each agent has an `agent.json` file with `heartbeat.every` field defining automatic execution frequency (e.g., `6h` for Simulator, `24h` for Engineer) |
| **Native Cron Tool** | Agents can register scheduled jobs using `cron add` commands for precise timing across the loop (Synthesizer 7am, Engineer 7:30am, etc.) |
| **Agent Configuration** | `config.json` defines agents list with workspaces, agent directories, defaults for models, concurrency, and sandbox mode |
| **Memory System** | Hybrid keyword + vector memory with auto-save, citations, temporal decay, and configurable chunking for accumulated simulation data |
| **Postgres Memory Backend** | Direct database storage for results, state checkpoints, and accumulated data with connection pooling |
| **API Gateway** | Port 18790 gateway with HTTP endpoints for external messaging, responses, and control UI access |
| **Tools Framework** | Built-in tools: file_read, file_write, shell, delegate, http_request for agent operations |
| **Commands & Skills** | Custom command registration via `. Commands` and optional skill extensions via npm |
| **Reliability Features** | Circuit breakers, response caching, automatic retries, and fallback policies for failure recovery |
| **Diagnostics Logging** | Configurable debug logging: `log_llm_io`, `log_message_payloads`, `log_tool_calls` |
| **Notifications** | Telegram channel integration with bot tokens and authorized user lists for admin alerts |
| **State Persistence** | Memory hygiene, snapshots auto-save, archive/purge policies for state and conversation retention |
| **Concurrent Execution** | `maxConcurrent` limits and `subagents.maxConcurrent` settings for controlled parallel resource usage |

### Configuration Files

**Agent Heartbeat Scheduling** (`nullclaw_data/agents/{agent}/agent/agent.json`):

```json
{
    "heartbeat": {
        "every": "6h"  // Simulators run frequently, Synthesizer/Engineer run less frequently
    }
}
```

**Loop Configuration** (`config.json`):

- Agents list with workspaces and agent directories
- Model provider configuration with NVIDIA and OpenRouter
- Memory backend settings (hybrid keyword + vector with pgvector)
- Tool permissions and optional tools configuration
- Gateway settings (port, auth, allowed origins)
- Skills configuration for external integrations

**Main Agent Registration**:
- Main agent registers all sibling cron jobs on first heartbeat
- Uses `cron add` command for each scheduled job
- Jobs persist across gateway restarts

### State Management Implementation

**Accumulated Results Storage**:
- Use Postgres `memory.postgres` backend for persistence
- Create dedicated tables for simulation results, synthesis outputs, and checkpoint state
- Leverage pgvector for semantic search of accumulated data

**Checkpoint System**:
- Use memory snapshots for agent state
- Configure `auto_hydrate` and `snapshot_on_hygiene` in `memory.lifecycle`
- Archive/purge policies: `archive_after_days: 7`, `purge_after_days: 30`

**Error Recovery Flow**:
1. Agent fails → state checkpoint captured
2. Next heartbeat triggers → agent restarts from checkpoint
3. Diagnostics logging (`log_tool_calls`) provides failure context
4. Circuit breaker prevents cascading failures (5 failures → 30s cooldown)

### Health Monitoring Implementation

Use nullclaw's diagnostic flags plus external health checks:

**NullClaw Built-in**:
- `diagnostics.log_llm_io` — track model invocation health
- `diagnostics.log_message_payloads` — identify stuck states
- `diagnostics.log_tool_calls` — track tool execution status

**Agent-Level Monitoring**:
- Each agent heartbeat can check elapsed time and trigger alerts
- Use Telegram channel for admin notifications on unhealthy states
- Memory lifecycle stats for resource usage tracking

### Resource Control Implementation

**Token Budget Enforcement**:
- Track token usage per agent via `log_llm_io`
- Implement budget checks before model invocations
- Use circuit breaker when budget exceeded

**Concurrency Limits**:
- `agents.defaults.maxConcurrent` setting for overall limit
- `agents.defaults.subagents.maxConcurrent` setting for child agent limits
- Queue behavior via reliability circuit breaker

**Rate Limiting**:
- API rate limiting via `memory.reliability` configuration
- Throttling rather than hard failures via `fallback_policy: degrade`
- Shadow mode and canary support for gradual rollout

### Agent Configuration Reference

| File | Purpose | Key Settings |
|------|---------|--------------|
| `config.json` | Global configuration | Models, memory, agents list, gateway settings, skills |
| `agents/{agent}/agent/agent.json` | Per-agent heartbeat | `heartbeat.every` for scheduling |
| `agents/{agent}/agent/system.md` | Agent identity & capabilities | Role, tools, constraints |
| `workspace/{agent}/HEARTBEAT.md` | Periodic task list | What to do when heartbeat triggers |
| `workspace/{agent}/AGENTS.md` | Workspace context | Agent capabilities within workspace |

---

## User Scenarios & Testing

### User Story 1 - Loop Scheduling Control (Priority: P1)

As an operator, I want to configure when and how often each agent runs so I can control resource usage and operational hours for different parts of the loop.

**Why this priority**: Without scheduling control, agents run unpredictably and may consume resources during off-hours or overwhelm the system.

**Independent Test**: Configuration layer that controls each agent's execution frequency and timing without modifying agent behavior.

**Acceptance Scenarios**:

1. **Given** the loop is configured, **When** the scheduled time arrives for an agent, **Then** that agent initiates automatically
2. **Given** an operator sets the Simulator to run hourly and Synthesizer to run daily, **When** the system time triggers, **Then** each agent runs at its configured frequency
3. **Given** an operator sets agents to run only between 9am and 6pm, **When** the system is within those hours, **Then** the agents trigger according to their schedules

---

### User Story 2 - Error Recovery & Resume (Priority: P1)

As an operator, I want the loop to recover from failures and resume without manual intervention so I do not need constant monitoring.

**Why this priority**: Unrecoverable failures require manual intervention and break the automation intent. The system must be self-healing.

**Independent Test**: Error handling and state persistence that allows loop components to resume from failure points.

**Acceptance Scenarios**:

1. **Given** an agent fails mid-execution, **When** the next scheduled trigger arrives for that agent, **Then** the agent resumes from the failure point
2. **Given** an agent invocation fails, **When** the error occurs, **Then** the system retries up to configured limits with exponential backoff
3. **Given** multiple consecutive failures occur, **When** the retry limit is exceeded, **Then** the system alerts the operator and pauses that agent

---

### User Story 3 - Health Monitoring & Alerting (Priority: P1)

As an operator, I want to be notified when the loop is unhealthy or stuck so I can intervene before service impact occurs.

**Why this priority**: Silent failures or stalls go unnoticed until user-facing degradation occurs.

**Independent Test**: Monitoring layer that detects unhealthy conditions and sends alerts without affecting loop execution.

**Acceptance Scenarios**:

1. **Given** an agent has not completed for 3 scheduled cycles, **When** the monitoring check runs, **Then** an alert is sent to the operator
2. **Given** an agent is stuck or unresponsive for more than 15 minutes, **When** the health check runs, **Then** an alert is sent
3. **Given** the average agent execution time exceeds expected thresholds, **When** the performance check runs, **Then** a warning is sent

---

### User Story 4 - Resource Controls & Rate Limiting (Priority: P2)

As an operator, I want to configure resource limits for the loop so it cannot consume all available capacity or exceed cost budgets.

**Why this priority**: Uncontrolled resource usage causes cost overruns and impacts other services.

**Independent Test**: Rate limiting and resource governor that enforces caps without modifying loop logic.

**Acceptance Scenarios**:

1. **Given** a daily token budget is configured, **When** the budget is consumed, **Then** the loop pauses until the next budget period
2. **Given** a maximum concurrent agent limit is set, **When** additional agents would be spawned, **Then** they wait until capacity is available
3. **Given** API rate limits are configured, **When** the rate is exceeded, **Then** requests are throttled rather than failed

---

### User Story 5 - State Management & Checkpoints (Priority: P2)

As an operator, I want the loop to maintain checkpoints between stages so interruption does not require restarting the entire loop.

**Why this priority**: Long-running loops that restart from scratch waste time and compute resources.

**Independent Test**: State persistence layer that captures loop progress and allows stage-by-stage resumption.

**Acceptance Scenarios**:

1. **Given** the Simulator completes a cycle and accumulates results, **When** Synthesizer starts, **Then** the Simulator results are persisted and passed forward
2. **Given** Synthesizer is interrupted, **When** it resumes, **Then** it continues from the interruption point not from the beginning
3. **Given** all agents complete their scheduled work, **When** the next period starts, **Then** agents execute with fresh initialization

---

### User Story 6 - Data Accumulation For Synthesis (Priority: P2)

As an operator, I want the system to accumulate simulation results over time so Synthesizer has sufficient data quality for meaningful analysis.

**Why this priority**: Aggregating multiple simulation runs before synthesis yields actionable insights rather than sparse individual data points.

**Independent Test**: Data persistence layer that maintains accumulated results between synthesis cycles.

**Acceptance Scenarios**:

1. **Given** multiple Simulator runs complete, **When** Synthesizer executes, **Then** it accesses all accumulated results from its previous execution
2. **Given** Synthesizer completes analysis, **When** the next cycle starts, **Then** the system preserves only the most relevant historical data based on configured retention
3. **Given** an operator views accumulated data, **When** the interface displays summary, **Then** they see aggregate metrics and representative samples rather than raw data

---

### Edge Cases

- What happens when an agent is manually stopped mid-execution?
- How does the system handle configuration changes while the loop is running?
- What happens when the loop encounters an agent that does not exist or is misconfigured?
- How does the loop handle network partitions or database connectivity loss?
- What happens when multiple agents have conflicting schedules?
- How does the system handle daylight savings time or timezone changes in scheduling?
- What happens when accumulated simulation data exceeds configured retention limits?
- How does the system handle situations where Synthesizer has insufficient data for meaningful analysis?

---

## Requirements

### Functional Requirements

**Scheduling & Execution**
- **FR-001**: System MUST support configurable execution schedules for each agent independently including one-time, interval-based, and window-based triggers
- **FR-002**: System MUST support manual start, stop, and pause commands for each agent
- **FR-003**: System MUST enforce maximum concurrent executions per agent to prevent resource contention

**Data Accumulation**
- **FR-004**: System MUST preserve simulation results between Synthesizer executions for aggregation
- **FR-005**: System MUST support configurable data retention policies for accumulated results
- **FR-006**: System MUST provide query capabilities for accessing accumulated simulation results

**Error Recovery**
- **FR-007**: System MUST automatically retry failed agent invocations up to configurable limits
- **FR-008**: System MUST implement exponential backoff between retries to avoid overwhelming services
- **FR-009**: System MUST persist agent state at execution boundaries for resumption after failures
- **FR-010**: System MUST provide configurable failure thresholds that trigger operator alerts and agent pausing

**Health Monitoring**
- **FR-011**: System MUST monitor agent execution time and alert when thresholds are exceeded
- **FR-012**: System MUST detect stuck or unresponsive agents and alert operators
- **FR-013**: System MUST track agent completion rates and alert when consecutive cycles fail
- **FR-014**: System MUST provide dashboard visibility into agent status, history, and health

**Resource Controls**
- **FR-015**: System MUST enforce configurable token budgets and pause loops when exceeded
- **FR-016**: System MUST enforce maximum concurrent agent limits with queuing behavior
- **FR-017**: System MUST implement API rate limiting with throttling rather than hard failures
- **FR-018**: System MUST track resource usage per agent execution and provide cost estimates

**State Management**
- **FR-019**: System MUST capture agent state checkpoints at execution boundaries
- **FR-020**: System MUST support resuming from specific execution points rather than full restart
- **FR-021**: System MUST clear stale state when starting fresh execution cycles
- **FR-022**: System MUST support agent state inspection and manual state correction

### Key Entities

- **Loop Configuration**: Represents the scheduling and execution settings for each agent, including frequency, time windows, resource limits, and retry policies
- **Agent Execution**: Represents a single run of an agent, including start time, completion time, status, and results
- **Accumulated Results**: Represents the collection of simulation results preserved between Synthesizer executions for aggregation
- **Agent Checkpoint**: Represents the persisted state of an agent at a specific point in time, enabling resumption from that state
- **Agent Alert**: Represents a notification sent to operators regarding agent health, failures, or resource events
- **Resource Budget**: Represents consumable resource limits including token budgets, cost caps, and time windows

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Operators can configure agent schedules and see changes reflected within 1 minute
- **SC-002**: Failed agent executions recover and resume within 5 minutes without manual intervention
- **SC-003**: Health alerts are sent within 1 minute of unhealthy condition detection
- **SC-004**: Agent checkpoints are captured within 5 seconds of stage completion
- **SC-005**: Resource controls prevent agents from exceeding configured budget caps by more than 5%
- **SC-006**: Manual agent state correction takes effect within 10 seconds of submission
- **SC-007**: Synthesizer has access to all simulation results accumulated since its previous execution
- **SC-008**: Accumulated data queries complete within 10 seconds for typical aggregation windows

### Quality Outcomes

- **SC-009**: Agent state persists across system restarts with no data loss
- **SC-010**: Configuration changes applied during execution do not corrupt running agents
- **SC-011**: Alert notifications contain actionable information for operator response
- **SC-012**: Resource violations do not degrade system stability beyond the violating agent
- **SC-013**: Data accumulation maintains referential integrity even when individual agent runs fail

---

## Assumptions

- Nullclaw-kube agent framework supports state persistence and recovery APIs
- Postgres is available for result storage, state persistence, and checkpoint storage
- The operator has permissions to manage agent schedules and resource limits
- Agent invocations return execution status and error information
- System clock is synchronized for reliable scheduling
- Notification infrastructure is available for alert delivery
- Token usage metrics are available from model providers
- Synthesizer can operate even when accumulated data is sparse by providing appropriate warnings

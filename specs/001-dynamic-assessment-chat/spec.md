# Feature Specification: Dynamic Assessment Chat

**Feature Branch**: `001-dynamic-assessment-chat`  
**Created**: 2026-03-01
**Status**: Draft  
**Input**: User description: "i want to make the ai assessment chat more dynamic and more live conversation like instead of following a strict script. it needs follow the topics to understand their current situation and synthesize the finding, but we need to allow the LLM to be authetic and provide a dynamic talking engagement. lets change the concept of the src/constants.ts, we don't want to hardocre the interaction. instead we should allow me as the developer to cofnigure and tweak and configure the temp of the interaction. and have intent or questions to ask, but not hard coded questions, the interaction can be dynamic where if the user wants to talk more, we can allow them to stay on a topic until they indicate we can move on. also, we need to confirm and close out the chat (asking the user if they are ready for the synthesize report, or move on) before we synthesize the report, giving the control to the user and allow a more natural conversation flow."

## Clarifications

### Session 2026-03-01
- Q: How should we track granular topic progression since we are making the chat fully dynamic? → A: Option A - The LLM uses a secondary tool (`update_current_topic()`) to notify the backend when it moves to a new topic for telemetry.
- Architectural Pivot from User: The agent will be powered by OpenClaw to enable self-improvement and self-healing. The frontend chat will connect to a guarded backend proxy that communicates with an OpenClaw agent, using persona files (`SOUL.md`, `IDENTITY.md`) to define behavior. The system must include a README or instructions on how developers track telemetry and market signals to reintegrate into the self-improvement loop.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Topic Navigation (Priority: P1)

As an executive user, I want the AI to converse with me dynamically based on a core set of topics and intents, rather than forcing me through a rigid script, so that the conversation feels authentic, responsive, and personalized to my specific situation.

**Why this priority**: The current tightly-scripted 3-stage diagnostic journey feels rigid and robotic. A dynamic configuration unleashes the power of the LLM to naturally explore the user's business context, building trust and engagement.

**Independent Test**: Can be fully tested by providing varying lengths and depths of answers to the AI. The AI should naturally stay on a topic if more exploration is needed, or move to the next topical intent if the current goal is satisfied.

**Acceptance Scenarios**:

1. **Given** the user provides a very short answer, **When** the AI responds, **Then** the AI asks a follow-up question naturally scoped to the current topic's intent to dig deeper.
2. **Given** the user provides a comprehensive, insightful answer, **When** the AI evaluates the response, **Then** the AI seamlessly transitions to the next configuration topic.
3. **Given** the assessment is initiated, **When** the initial prompt is generated, **Then** it is dynamically constructed from the configured topics, goals, tone, and temperature settings rather than a single hardcoded string.

---

### User Story 2 - Explicit Synthesis Confirmation (Priority: P1)

As an executive user, I want the AI to explicitly ask for my permission to end the assessment and synthesize the report, so that I maintain control over the conversation flow and can add final thoughts if needed.

**Why this priority**: It solves the problem of abruptly cutting off the user. Giving control back to the user ensures they feel heard and respected, which is crucial for an executive audience.

**Independent Test**: Can be fully tested by reaching the end of the configured topics. The AI should ask a closing question and wait for affirmative user consent before generating the synthesis.

**Acceptance Scenarios**:

1. **Given** the AI has covered all configured topics, **When** it sends its next message, **Then** it asks a friendly confirmation question (e.g., "Are you ready for me to synthesize our conversation into a report?").
2. **Given** the AI has asked the confirmation question, **When** the user says "No, I actually wanted to add...", **Then** the AI acknowledges the input and stays in the conversation.
3. **Given** the AI has asked the confirmation question, **When** the user agrees (e.g., "Yes, let's do it"), **Then** the AI detects this affirmative intent and successfully transitions the application to the synthesis phase.

---

### User Story 3 - Codebase Configuration Management & Self-Improvement (Priority: P2)

As a developer, I want to manage the chat's topics, intents, and persona explicitly through declarative files (`SOUL.md`, `IDENTITY.md`, config files) and connect to an OpenClaw agent via a guarded proxy, so that the AI can self-improve based on market signals and I can iterate rapidly.

**Why this priority**: Allows for clean separation of concerns, rapid iteration without UI tools, and sets up a powerful feedback loop for telemetry-driven agent self-improvement.

**Independent Test**: Can be fully tested by modifying the `SOUL.md` or configuration files within the codebase, starting a session through the proxy, and observing the new capabilities. Following the session, the developer can read the telemetry guidelines to see how the data feeds back into the loop.

**Acceptance Scenarios**:

1. **Given** the developer modifies the `temperature` in the codebase configuration, **When** a new session starts, **Then** the LLM's API calls utilize the updated temperature.
2. **Given** the developer adds a new topic object with a specific intent to the array, **When** a new session runs, **Then** the AI explicitly covers this new intent during the conversation.

---

### Edge Cases

- What happens if the user ignores the AI's attempt to confirm the synthesis and asks a completely unrelated question? (The AI should handle it naturally and re-verify readiness later).
- What happens if the LLM hallucinatingly triggers the synthesis intent prematurely before the user explicitly agrees? (The system prompt should strongly guardrail the LLM to strictly wait for affirmative user consent).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST connect to an OpenClaw agent via a guarded backend proxy layer that manages the chat state and applies security guardrails.
- **FR-002**: System MUST allow the developer to modify the agent's behavior purely through codebase configuration files (e.g., `SOUL.md`, `IDENTITY.md`, and config arrays for topics/intents).
- **FR-003**: System MUST NOT use explicit string keyword matching (e.g., "let me synthesize") to trigger the end of the conversation.
- **FR-004**: System MUST utilize LLM Semantic Intent Detection (e.g., Function Calling / Tool Use) to determine when the user has agreed to synthesize the conversation.
- **FR-005**: System MUST prompt the user for explicit confirmation before invoking the synthesis intent/tool.
- **FR-006**: System MUST instruct the LLM to manage the flow of conversation, determining when an intent is satisfied and when to move to the next topic.
- **FR-007**: System MUST provide a mechanism for the LLM to emit its current conversational topic state via a secondary tool call (e.g., `update_current_topic()`) to capture telemetry.
- **FR-008**: System MUST provide documentation (e.g., README) guiding developers on how to monitor telemetry and reintegrate it for agent self-improvement.

### Key Entities

- **AssessmentConfig**: A structured object/files (including `SOUL.md`, `IDENTITY.md`) containing the persona, goals, and an array of `topics`.
- **Topic**: An object representing a conversational stage, containing properties like `name`, `intent`/`goal`, and `priority`.
- **GuardedProxy**: The backend routing layer that strictly validates inputs/outputs between the frontend and the OpenClaw agent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of synthesis transitions are triggered by semantic intent/function calls rather than brittle regex or keyword matches.
- **SC-002**: 100% of completed sessions include an explicit confirmation turn where the user agrees to end the conversation before the report is generated.
- **SC-003**: The developer can add a new conversation topic and intent strictly by adding an entry to the configuration array, requiring 0 changes to prompt assembly logic.

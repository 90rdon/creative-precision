# Feature Specification: Build Audit Trail & Visibility

**Feature Branch**: `007-build-audit-trail`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User description: "i don't need to run this in dev env, we can test in nullclaw, but i want to know if there is a easy way for me to: how i can i find out when test are ran and how to to see the results and what has been synthesized and build by the engineer. we also need a way to keep track of the engineer changes in git so we can have the ability to roll back the changes if need to."

---

## Architecture

### 3-Layer Audit Trail

The audit trail is organized into three complementary layers, each serving a different purpose:

| Layer | Purpose | Granularity | Typical Query |
|-------|---------|-------------|---------------|
| **Trace** | End-to-end request tracking from start to finish | Request-level | Show everything that happened in this session |
| **Metrics** | Quantitative performance and cost data | Aggregated over time | Show average latency for test runs last week |
| **Logs** | Event-level detail for debugging and analysis | Event-level | Show all events that occurred for this test run |

The layers are complementary not redundant: traces provide context, metrics provide trends, logs provide detail.

**Trace Layer**: Captures the complete journey of each activity through the system, linking test runs, synthesis, builds, and code changes into coherent end-to-end stories.

**Metrics Layer**: Aggregates quantitative data including response times, success rates, token usage, and inference costs over time to support trend analysis and cost optimization.

**Logs Layer**: Individual event-level records including API calls, model invocations, file operations, and errors for detailed debugging and forensic analysis.

---

## User Scenarios & Testing

### User Story 1 - Quick Visibility Dashboard (Priority: P1)

As an operator, I want a single place to see all recent test runs, synthesis outputs, and build activity so I can quickly understand what the system has been doing without running manual database queries.

**Why this priority**: This is the most common use case — knowing what the system did recently. Operators need immediate visibility without SQL expertise.

**Independent Test**: Can be implemented as a read-only query interface that displays activity without changing any behavior. Delivers immediate value by saving time spent writing SQL queries.

**Acceptance Scenarios**:

1. **Given** a user accesses the audit interface, **When** they view the dashboard, **Then** they see the 20 most recent test runs with status, duration, and completion time
2. **Given** a user accesses the audit interface, **When** they filter by a specific time range, **Then** they see only activities within that time window
3. **Given** a user accesses the audit interface, **When** they view synthesis results, **Then** they see all recent synthesis outputs linked to their originating test runs

---

### User Story 2 - Test Result Deep Dive (Priority: P2)

As an operator, I want to view detailed test results including full transcripts and evaluation scores so I can understand what worked and what needs improvement.

**Why this priority**: Enables investigation and debugging. Still valuable but secondary to knowing what ran.

**Independent Test**: Read-only access to detailed test data that already exists in the database and log files. Adds value by surfacing existing data without new storage requirements.

**Acceptance Scenarios**:

1. **Given** a test run exists, **When** the user views its details, **Then** they see the full conversation transcript and evaluation metrics
2. **Given** a test run failed, **When** the user views its details, **Then** they see the error message and diagnostic context
3. **Given** the user views test details, **When** synthesis results exist for that run, **Then** they see the linked synthesis outputs with sentiment scores and identified trends

---

### User Story 3 - Engineer Change Tracking & Rollback (Priority: P1)

As an operator, I want to see what changes the engineer agent made to the workspace code and be able to roll back specific changes so I can maintain control over what gets deployed.

**Why this priority**: Essential for maintaining system integrity. Without rollback capability, automated changes pose risk to production stability.

**Independent Test**: Can be implemented as a change tracking layer that records git operations and creates rollback points without affecting other functionality.

**Acceptance Scenarios**:

1. **Given** the engineer agent makes changes, **When** the agent writes code, **Then** each change is tracked with a git commit reference and timestamp
2. **Given** a change was made, **When** an operator views the changes, **Then** they see a list of modified files and commit messages
3. **Given** an operator wants to revert a change, **When** they trigger rollback for a specific commit, **Then** the system restores files to the state before that commit
4. **Given** an operator triggers rollback, **When** the operation completes, **Then** they see confirmation of which files were reverted

---

### User Story 4 - Build Artifact Visibility (Priority: P3)

As an operator, I want to see what artifacts were built by the engineer agent so I can verify that synthesis outputs produced deployable code.

**Why this priority**: Helpful for verification and debugging but less critical than seeing what ran or being able to roll back.

**Independent Test**: Surfaces already-produced build metadata without requiring new build pipeline changes.

**Acceptance Scenarios**:

1. **Given** the engineer runs a build, **When** the build completes, **Then** the system records what artifacts were produced and their locations
2. **Given** a user views build artifacts, **When** they access the audit interface, **Then** they see file names, sizes, and timestamps for all generated artifacts
3. **Given** build artifacts exist, **When** a user requests download, **Then** they can retrieve the artifact files

---

### User Story 5 - Cost Visibility (Priority: P1)

As an operator, I want to see token costs, inference costs, and other usage metrics so I can understand the economic impact of AI operations and optimize spending.

**Why this priority**: Essential for operational forecasting and cost control. Without visibility into costs, AI usage scales unpredictably.

**Independent Test**: Read-only aggregation of existing usage metrics that are already captured by model invocation logging.

**Acceptance Scenarios**:

1. **Given** a test run completes, **When** the audit is updated, **Then** the system records token usage and inference cost for the run
2. **Given** a user views cost metrics, **When** they select a time range, **Then** they see total costs broken down by agent and operation type
3. **Given** a user views cost trends, **When** they compare time periods, **Then** they see cost growth rates and outlier high-cost activities

---

### Edge Cases

- What happens when a test run is interrupted or cancelled mid-execution?
- How does the system handle missing or corrupt log files when displaying audit information?
- What happens when a rollback operation cannot complete due to merge conflicts?
- How does the audit interface handle very large result sets (thousands of runs)?
- What happens when a user tries to roll back changes that have already been deployed to production?
- What happens when cost tracking data is incomplete or unavailable from the model provider?
- How does the system handle currency conversion for model costs denominated in different currencies?

---

## Requirements

### Functional Requirements

**Audit Layers**
- **FR-001**: System MUST capture end-to-end traces linking test runs, synthesis outputs, builds, and code changes
- **FR-002**: System MUST aggregate metrics over time including performance, usage, and cost data
- **FR-003**: System MUST record event-level logs for all operations including API calls, model invocations, and file operations

**Cost Tracking**
- **FR-004**: System MUST record token usage for every model invocation including input tokens, output tokens, and total tokens
- **FR-005**: System MUST calculate inference costs for each model invocation based on token usage and pricing
- **FR-006**: System MUST provide cost breakdown by agent, operation type, and time period
- **FR-007**: System MUST display cost trends comparing current periods to historical baselines

**Visibility & Querying**
- **FR-008**: System MUST provide a single interface for viewing recent test runs with sortable columns for status, duration, and completion time
- **FR-009**: System MUST display synthesis outputs linked to their originating test runs with sentiment scores and identified trends
- **FR-010**: System MUST filter audit views by time range, status, and agent/entity type
- **FR-011**: System MUST display full conversation transcripts for test runs on demand
- **FR-012**: System MUST show error messages and diagnostic context for failed test runs

**Change Tracking & Rollback**
- **FR-013**: System MUST track all engineer agent file changes with git commit references, timestamps, and affected files
- **FR-014**: System MUST support one-click rollback for any tracked change, restoring files to their prior state
- **FR-015**: System MUST provide confirmation of rollback operations listing all affected files
- **FR-016**: System MUST preserve audit history even when content is rolled back

**Build Artifacts**
- **FR-017**: System MUST record build artifacts produced by the engineer agent with file metadata and locations

### Key Entities

**Core Activity Entities**
- **Test Run**: Represents a single execution of a simulated assessment session, including persona used, strategy, status, duration, completion time, and error state if applicable
- **Test Result**: Contains evaluation outcomes for a test run, including scores, pass/fail status, metrics, and identified gaps or issues
- **Synthesis Output**: The analysis generated from test runs, containing sentiment analysis, identified market trends, feedback quotes, and actionable insights
- **Engineer Change**: Represents a single set of modifications made by the engineer agent, including git_COMMIT reference, timestamp, list of modified files, and commit message
- **Build Artifact**: Represents a file or asset produced by the engineer agent build process, with file name, size, timestamp, and storage location
- **Rollback Point**: Represents the specific state before a change, containing the git commit hash that can be restored to revert the change

**Audit Layer Entities**
- **Trace Record**: Represents a complete end-to-end journey through the system, linking multiple related activities and events by request id and session id
- **Metric Record**: Aggregated quantitative data including response times, success rates, and usage statistics calculated over a time window
- **Log Entry**: Individual event-level record containing event type, event data, source component, and timestamp

**Cost Tracking Entities**
- **Model Invocation**: Represents a single model API call, including model name, input tokens, output tokens, total tokens, and calculated cost
- **Cost Summary**: Aggregated cost data by agent, operation type, and time period, including totals, averages, and growth rates
- **Cost Threshold**: Configurable limit for acceptable costs with alert notification when thresholds are exceeded

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Operators can view the status of the 20 most recent test runs in under 5 seconds
- **SC-002**: Users can access detailed test results including transcripts and evaluation scores with 3 clicks or fewer
- **SC-003**: Rollback operations complete within 10 seconds for changes affecting fewer than 10 files
- **SC-004**: Audit interface displays accurate time information for all activities with no more than 1 second drift
- **SC-005**: Users can successfully roll back any tracked change without command-line access
- **SC-006**: Synthesis outputs can be located within 5 seconds when starting from a test run reference
- **SC-007**: Cost summaries are available within 30 seconds of activity completion
- **SC-008**: Trace records are linked within 5 seconds of all related activities completing

### Quality Outcomes

- **SC-009**: Audit information remains accurate and accessible even after system restarts
- **SC-010**: Rollback operations never leave the workspace in an inconsistent state
- **SC-011**: All critical activities (test runs, synthesis, builds, changes) appear in audit history within 10 seconds of completion
- **SC-012**: Cost tracking maintains accurate totals across all model invocations with no duplicate counting
- **SC-013**: All three audit layers (trace, metrics, logs) remain consistent for the same activities

---

## Assumptions

- Git is already configured and being used for code management in the workspace
- Test runs, synthesis outputs, and build events are already being logged to Postgres
- The operator has appropriate permissions for git operations on the workspace
- Rollback will be performed in a non-production environment (nullclaw) before promotion to production
- The audit interface will initially be CLI-based with potential for future GUI enhancement
- Model providers return token usage information and pricing for API calls
- System clock is synchronized for accurate time-based aggregation and metrics

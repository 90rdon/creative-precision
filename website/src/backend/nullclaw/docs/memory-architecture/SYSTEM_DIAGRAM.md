# System Diagram

## Visual Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │      Nullclaw Multi-Instance         │
                                    │         Memory System                │
                                    └─────────────────────────────────────┘
                                                          │
                          ┌─────────────────────────────────────────────────┐
                          │                                                   │
            ┌─────────────────────────┐         ┌─────────────────────────┐
            │     Atlas Instance      │         │     Vigil Instance      │
            ├─────────────────────────┤         ├─────────────────────────┤
            └─────────────────────────┘         └─────────────────────────┘
                          │                                       │
                          │ ┌─────────────────────────────────────┐ │
                          │ │             AGENTS                   │ │
                          │ │  ├─ Main         ├─ Main           │ │
                          │ │  ├─ Context      ├─ Research       │ │
                          │ │  ├─ Research     ├─ Governance     │ │
                          │ │  └─ ...          └─ ...            │ │
                          │ └─────────────────────────────────────┘ │
                          │                                       │
                          └─────────────────┬─────────────────────┘
                                            │
                           ┌──────────────────────────────────────┐
                           │   Memory Consolidation Service       │
                           │   • L1→L2: Snapshot every 10s        │
                           │   • L2→L3: Summarize every hour      │
                           │   • L3→L4: Score daily at 3 AM       │
                           │   • L4→L5: Pattern extraction         │
                           └──────────────────────────────────────┘
                                            │
                           ┌──────────────────────────────────────┐
                           │         STORAGE LAYERS                │
                           ├──────────────────────────────────────┤
                           │                                        │
                           │  ┌──────────────┐  ┌──────────────┐ │
                           │  │  L1          │  │  L2          │ │
                           │  │  Working     │  │ Short-Term   │ │
                           │  │  (in-memory) │  │  (SQLite)    │ │
                           │  └──────────────┘  └──────────────┘ │
                           │        │                  │          │
                           │        ↓ 10s              ↓ 1 hour   │
                           │  ┌──────────────┐  ┌──────────────┐ │
                           │  │  L3          │  │  L4          │ │
                           │  │  Medium      │  │ Long-Term    │ │
                           │  │  (PostgreSQL)│  │  (Qdrant)    │ │
                           │  │  + pgvector  │  │  (Vector)    │ │
                           │  └──────────────┘  └──────────────┘ │
                           │        │                  │          │
                           │        ↓ Daily            ↓ Weekly   │
                           │  ┌──────────────┐                     │
                           │  │  L5          │                     │
                           │  │  Semantic    │                     │
                           │  │  (Permanent) │                     │
                           │  └──────────────┘                     │
                           └──────────────────────────────────────┘
                                            │
                           ┌──────────────────────────────────────┐
                           │      SYNC & CACHE LAYER               │
                           ├──────────────────────────────────────┤
                           │  ┌────────────┐  ┌────────────────┐ │
                           │  │  WebSocket │  │  Redis Pub/Sub │ │
                           │  │  Server    │  │  (real-time)   │ │
                           │  └────────────┘  └────────────────┘ │
                           └──────────────────────────────────────┘
                                            │
                           ┌──────────────────────────────────────┐
                           │      BACKUP & MONITORING             │
                           ├──────────────────────────────────────┤
                           │  ┌──────────────┐  ┌──────────────┐ │
                           │  │ CloudFlare   │  │ PostgreSQL   │ │
                           │  │ R2 (backup)  │  │ Dump (local) │ │
                           │  └──────────────┘  └──────────────┘ │
                           │  ┌──────────────┐  ┌──────────────┐ │
                           │  │ Prometheus   │  │  Grafana     │ │
                           │  │  (metrics)   │  │  (dashboard) │ │
                           │  └──────────────┘  └──────────────┘ │
                           └──────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY WRITE FLOW                                     │
└──────────────────────────────────────────────────────────────────────────────┘

1. Agent processes task
   ↓
2. Extracts relevant information
   ↓
3. Assigns tags: [instance:atlas, agent:main, action:task]
   ↓
4. ┌────────────────────────────────────────────────────────────────────────┐
   │ L1: Working Memory (In-Process)                                          │
   │   • Immediate context for reasoning                                      │
   │   • Current task state                                                  │
   │   • Snapshot every 10 seconds → L2                                      │
   └────────────────────────────────────────────────────────────────────────┘
   ↓ Periodic snapshot
5. ┌────────────────────────────────────────────────────────────────────────┐
   │ L2: Short-Term Memory (SQLite)                                           │
   │   • Recent conversations                                                 │
   │   • Current session context                                              │
   │   • Consolidate every hour → L3                                         │
   └────────────────────────────────────────────────────────────────────────┘
   ↓ Hourly consolidation
6. ┌────────────────────────────────────────────────────────────────────────┐
   │ L3: Medium-Term Memory (PostgreSQL + pgvector)                          │
   │   • Structured knowledge from recent work                               │
   │   • Task outcomes                                                       │
   │   • Importance scoring daily → L4                                       │
   └────────────────────────────────────────────────────────────────────────┘
   ↓ Daily promotion by score
7. ┌────────────────────────────────────────────────────────────────────────┐
   │ L4: Long-Term Memory (Qdrant Vector DB)                                 │
   │   • Core knowledge, patterns, lessons learned                            │
   │   • Pattern extraction weekly → L5                                      │
   └────────────────────────────────────────────────────────────────────────┘
   ↓ Weekly pattern extraction
8. ┌────────────────────────────────────────────────────────────────────────┐
   │ L5: Semantic Memory (Permanent)                                         │
   │   • Conceptual knowledge, definitions, procedures                       │
   └────────────────────────────────────────────────────────────────────────┘

Each step:
   • Tag inheritance: Child tags include parent tags
   • Access control: Based on tag visibility
   • Deduplication: Content hash + timestamp
   • Indexing: Full-text + vector + metadata
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY READ FLOW                                     │
└──────────────────────────────────────────────────────────────────────────────┘

1. Agent queries for context
   ↓
2. Check L1 Working Memory (cached)
   ↓ L1 Miss
3. Check L2 Short-Term (SQLite recent)
   ↓ L2 Miss
4. Check L3 Medium-Term (PostgreSQL + semantic)
   ↓ L3 Miss
5. Check L4 Long-Term (vector similarity search)
   ↓ L4 Miss
6. Check L5 Semantic (knowledge concepts)
   ↓
7. Merge and return ranked results

Query Types:
   • Tag-based search: ["shared", "action", "high"]
   • Full-text search: "project goals"
   • Vector similarity: [0.1, 0.2, ...]
   • Cross-instance: Memories with tags ["shared"]
```

---

## Service Interactions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE INTERACTIONS                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────┐   write         ┌──────────────┐   schedule    ┌──────────────┐
│  Agent   │ ────────────►    │  PostgreSQL  │  ◄───────────  │ Consolidation│
│  (Atlas) │                 │              │                │   Service    │
└──────────┘                 └──────────────┘                └──────────────┘
      │                              ▲   ▲                           │
      │                              │   │                           │
      │                              │   │ store                     │
      │                              │   └───────────┐               │
      │                              │               │               │
      │                               │ sync         │               │
      │                               ▼               │               │
      │                        ┌──────────────┐                │
      │                        │  WebSocket   │                │
      │                        │   Service    │                │
      │                        └──────────────┘                │
      │                               │                         │
      │                               │ pub/sub                │
      │                               ▼                         │
      └───────────────       ┌──────────────┐                  │
                        │    │    Redis     │                  │
                        │    └──────────────┘                  │
                        │         ▲  ▲                          │
                        │         │  │                          │
                        │         │  └────── cache              │
                        │         │                             │
                        │         │ vector search               │
                        │         ▼                             │
                        │  ┌──────────────┐                    │
                        │  │   Qdrant     │                    │
                        │  │ (Vector DB)  │                    │
                        │  └──────────────┘                    │
                        │                                       │
                        └──────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        CROSS-INSTANCE SHARE                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐  shares   ┌──────────────────────────────┐
│  Atlas     │ ─────────► │  shared_memories (PostgreSQL) │
│  Agent     │            │  • source_memory_id           │
└─────────────┘            │  • target_instance_id        │
                           │  • status (pending/synced)    │
                           └──────────────────────────────┘
                                        │
                                        ▼
┌─────────────┐  queries   ┌──────────────────────────────┐
│   Vigil     │ ─────────► │  v_cross_instance_memories    │
│   Agent     │            │  (View: shared with tags)      │
└─────────────┘            └──────────────────────────────┘
```

---

## Tag Hierarchy

```
nullclaw/
├── instance/
│   ├── atlas/
│   │   ├── main/        → Atlas:Main agent data
│   │   ├── context/     → Atlas:Context agent data
│   │   └── research/    → Atlas:Research agent data
│   └── vigil/
│       └── main/        → Vigil:Main agent data
├── access/
│   ├── public/          → Global access level
│   ├── shared/          → Cross-instance shared
│   └── private/         → Instance-only access
├── type/
│   ├── context/         → Contextual information
│   ├── action/          → Actionable items
│   ├── reference/       → Reference material
│   └── outcome/         → Task results
└── priority/
    ├── critical/        → Highest priority
    ├── high/            → High priority
    ├── normal/          → Normal priority
    └── low/             → Low priority

Example Memory Tags:
  ["public", "reference", "knowledge"]
  → Globally accessible knowledge

Example: ["atlas", "main", "shared", "context", "high"]
  → Atlas:Main agent's high-priority shared context

Example: ["sensitive", "config", "credentials"]
  → Marked sensitive, requires explicit permit
```

---

## Cost Flow

```
                    $0 Initial Setup
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
   Local Deployment                    Cloud Backup
   (Recommended)                       (Optional)
        │                                   │
        ├─ PostgreSQL: $0                    ├─ R2: ~$7.5/mo (500GB)
        ├─ Qdrant: $0                        ├─ S3 Glacier: ~$5/mo
        ├─ Redis: $0                         └─ Cloud Qdrant: $29/mo
        ├─ Embeddings: $0 (nomic free)
        └─ LLM: ~$5/mo (local)
                          │
              Total: ~$5-10/mo           Total: ~$15-35/mo
```

---

## Decision Flow

```
Start: Need Memory System
         │
         ▼
   ┌─────────────┐
   │ Deployment? │
   └─────────────┘
         │
    ┌────┴────┐
    │         │
     Local   Cloud
    (Free)   ($$$$)
     │         │
     ▼         ▼
  ┌─────┐  ┌─────────┐
  │Self │  │Managed  │
  │Host │  │Service  │
  │     │  │         │
  │Post │  │-Pinecone│
  │gres │  │-Supabase│
  │+    │  │-Neon    │
  │Vec  │  │         │
  └─────┘  └─────────┘
    │
    ▼
┌──────────┐
│Vector DB │
└──────────┘
    │
  ┌─┴─┐
  │   │
┌───┐ ┌─────┐
Qdrant│Chroma│
│     │     │
│Free │Free │
└─────┴─────┘
    │
    ▼
┌───────────┐
│ LLM Layer │
└───────────┘
    │
  ┌─┴─┐
  │   │
 ┌───┐ ┌─────────┐
 │Loc │ │   API   │
 │al  │ │OpenAI  │
 │Mod │ │   $20  │
 │els │ └─────────┘
 └───┘       │
    │         │
    └─────────┴─→ Hybrid (cache local, fallback API)
```

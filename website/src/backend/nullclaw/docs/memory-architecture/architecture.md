# Multi-Instance Long-Term Memory Architecture

## System Overview

This architecture provides a scalable, cost-efficient memory system supporting multiple instances (Vigil, Atlas), multiple agents, and processes with near real-time updates.

---

## Memory Hierarchy (5 Layers)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEMORY HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  L1: WORKING MEMORY                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Duration: Seconds to Minutes                                         │    │
│  │ Storage: In-Memory                                                   │    │
│  │ Size: ~1-10MB per agent                                             │    │
│  │ Use: Immediate context for reasoning, current task state            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                               ↓ Periodic (10s intervals)                     │
│  L2: SHORT-TERM MEMORY                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Duration: Hours to Days                                             │    │
│  │ Storage: SQLite + Redis                                              │    │
│  │ Size: ~10-100MB per agent                                           │    │
│  │ Use: Recent conversations, current session context                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                               ↓ Hourly                                      │
│  L3: MEDIUM-TERM MEMORY                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Duration: Days to Weeks                                            │    │
│  │ Storage: SQLite + Vector DB (pgvector)                              │    │
│  │ Size: ~100-500MB per agent                                          │    │
│  │ Use: Structured knowledge from recent work, task outcomes          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                               ↓ Daily                                        │
│  L4: LONG-TERM MEMORY                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Duration: Months to Years                                          │    │
│  │ Storage: Vector DB (Qdrant/Chroma) + PostgreSQL                     │    │
│  │ Size: 1-10GB (capped, with TTL)                                     │    │
│  │ Use: Core knowledge, patterns, lessons learned                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                               ↓ Weekly                                      │
│  L5: SEMANTIC MEMORY                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Duration: Permanent                                                 │    │
│  │ Storage: Knowledge Graph (optional) + Vector DB                     │    │
│  │ Size: Managed by importance scoring                                 │    │
│  │ Use: Conceptual knowledge, definitions, procedures                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Consolidation Pipeline

### L1 → L2 Working → Short-Term

**Trigger:** Every 10 seconds per agent
**Process:**
1. Working memory snapshot
2. Compress and deduplicate
3. Store with agent metadata and tags
4. Evict after 30 days TTL

### L2 → L3 Short-Term → Medium-Term

**Trigger:** Every hour
**Process:**
1. Summarize L2 entries using LLM
2. Extract key entities and relationships
3. Generate embeddings (if not cached)
4. Store in PostgreSQL + pgvector
5. Mark L2 for archival

### L3 → L4 Medium-Term → Long-Term

**Trigger:** Daily at 3 AM (off-peak)
**Process:**
1. Importance scoring (usage frequency, recency)
2. High-value memories → Vector DB
3. Medium-value memories → Archived SQLite
4. Low-value memories → Deleted

### L4 → L5 Long-Term → Semantic

**Trigger:** Weekly
**Process:**
1. Identify conceptual patterns
2. Build knowledge graph relationships
3. Extract procedures and definitions
4. Store in permanent semantic layer

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-INSTANCE MEMORY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────┐                            │
│  │     Atlas       │         │     Vigil       │                            │
│  │  ┌───────────┐  │         │  ┌───────────┐  │                            │
│  │  │   Main     │  │         │  │  Research  │  │                            │
│  │  └───────────┘  │         │  └───────────┘  │                            │
│  │  ┌───────────┐  │         │  ┌───────────┐  │                            │
│  │  │  Context  │  │         │  │Governance │  │                            │
│  │  └───────────┘  │         │  └───────────┘  │                            │
│  │  ┌───────────┐  │         │  ┌───────────┐  │                            │
│  │  │ Research  │  │         │  │   ...     │  │                            │
│  │  └───────────┘  │         │  └───────────┘  │                            │
│  │       │         │         │       │         │                            │
│  └───────┼─────────┘         └───────┼─────────┘                            │
│          │                            │                                     │
│          │          ┌───────────────────────────────────┐                 │
│          └──────────► MEMORY CONSOLIDATION SERVICE ◄────┘                 │
│                     └───────────────────────────────────┘                 │
│                                   │                                       │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     CONSOLIDATED STORAGE LAYER                       │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │        ┌────────────┐   ┌────────────┐   ┌────────────┐              │   │
│  │  L1/L2: │   Redis    │   │  SQLite    │   │   Local     │              │   │
│  │        │  (Cache)    │   │  (Fast     │   │  Files      │              │   │
│  │        └────────────┘   │  Storage)  │   └────────────┘              │   │
│  │                          └────────────┘                             │   │
│  │        ┌────────────┐   ┌────────────┐                              │   │
│  │  L3:    │ PostgreSQL │   │ pgvector   │                              │   │
│  │        │            │   │ (Semantic  │                              │   │
│  │        └────────────┘   │  Search)   │                              │   │
│  │                          └────────────┘                             │   │
│  │        ┌────────────┐   ┌────────────┐                              │   │
│  │  L4/5:  │  Qdrant    │   │  Qdrant    │                              │   │
│  │        │  (Cloud)   │   │  (Self-    │                              │   │
│  │        │            │   │  hosted)   │                              │   │
│  │        └────────────┘   └────────────┘                             │   │
│  │                                                                   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                   │                                       │
│                          ┌────────────────┐                             │
│                          │ SYNC SERVICE   │                             │
│                          │ (WebSocket +   │                             │
│                          │  CRDT/OT)      │                             │
│                          └────────────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technologies by Layer

### L1: Working Memory
- **Storage:** Process memory (no persistence)
- **Sync:** In-process communication
- **Cost:** Free (in-memory)

### L2: Short-Term Memory
- **Storage:** SQLite + Redis
- **Sync:** File-based sharing + Redis pub/sub
- **Cost:** Free (local)

### L3: Medium-Term Memory
- **Storage:** PostgreSQL 16+ with pgvector
- **Sync:** Database replication/wal
- **Cost:** Free (self-hosted)

### L4: Long-Term Memory
- **Storage:** Qdrant (self-hosted Docker) + PostgreSQL
- **Sync:** Vector DB replication
- **Cost:** ~$0 (self-hosted on existing hardware)

### L5: Semantic Memory
- **Storage:** Qdrant + Optional Knowledge Graph (RedisGraph)
- **Sync:** Same as L4
- **Cost:** ~$0 (local)

---

## Cost Optimization Strategy

### 1. Self-Hosted Primary Storage
- **PostgreSQL + pgvector:** Free (self-hosted)
- **Redis:** Free (local)
- **Qdrant:** Free (self-hosted Docker)
- **Total for local deployment:** $0

### 2. Cloud Backup Only (Tiered)
- **S3 Glacier:** ~$0.003/GB/month (cold storage)
- **S3 Standard:** ~$0.023/GB/month (hot storage)
- **Total for 50GB backup:** ~$1/day

### 3. Embedding Generation
- **Cache aggressively** (deduplication)
- **Use OpenAI text-embedding-3-small** ($0.02/1M tokens)
- **For 1M embeddings/year:** ~$20/year

### 4. LLM for Summarization
- **Use local models** (Llama 3.3, Qwen 3.5) where possible
- **Use API only** for complex reasoning
- **Estimated cost:** ~$5-10/month

### 5. Storage Lifecycle

| Age | Action | Storage | Cost |
|-----|--------|---------|------|
| < 1 day | Keep in Redis | Local | $0 |
| 1-7 days | SQLite + pgvector | Local | $0 |
| 7-30 days | PostgreSQL + embeddings | Local | $0 |
| 30-90 days | Compressed SQLite backup | S3 Glacier | ~$0.01/day |
| > 90 days | Archived or deleted | Glacier/S3 Standard | ~$0.05/day |

---

## Real-Time Sync Architecture

### Near Real-Time Updates (Sub-1s latency)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Atlas     │         │   Vigil     │         │   Other     │
│   Agent     │         │   Agent     │         │   Agents    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                      │                      │
       │ 1. WebSocket         │                      │
       │    connection       │                      │
       ├─────────────────────►│                      │
       │                      ├────────────────────►│
       │                      │                      │
       │ 2. Publish updates   │                      │
       │                      │                      │
       ├─────┐                │                      │
       │     │                │                      │
       ▼     │                │                      │
  ┌─────────┴────────────────────────────────────────┐
  │           MEMORY SYNC SERVICE                      │
  │           (Redis + WebSocket Server)               │
  │                                                    │
  │  • Real-time pub/sub (Redis Pub/Sub)              │
  │  • WebSocket push to connected agents             │
  │  • Conflict resolution with LWW (Last Write Wins) │
  │  • CRDT-style merging for concurrent updates      │
  └──────────────────────────────────────────────────┘
       │
       │ 3. Direct DB writes
       │                     ┌────────────┐
       │                     │ PostgreSQL  │
       │                     │   +         │
       │ 4. Vector embedding │  pgvector   │
       │  generation         └────────────┘
       │
       ▼
  ┌────────────┐
  │  Qdrant    │
  │  Vector DB │
  └────────────┘
```

### Sync Mechanisms

| Scenario | Sync Method | Latency |
|----------|------------|---------|
| Same instance, same agent | Direct memory write | <1ms |
| Same instance, different agents | Redis pub/sub | <10ms |
| Different instances | WebSocket + async queue | <100ms |
| Cross-instance consolidation | Batch processing (hourly) | 1 hour |
| Long-term archiving | Cron job (daily) | 24 hours |

---

## Data Flow Example

### Memory Write Flow

```
1. Agent processes task
   ↓
2. Extracts relevant information
   ↓
3. Assigns tags: [instance:atlas, agent:main, action:task]
   ↓
4. L1 Working Memory (in-process)
   └─→ Snapshot every 10s → L2
       ↓
5. L2 Short-Term (SQLite + tags)
   └─→ Consolidate hourly → L3
       ↓
6. L3 Medium-Term (PostgreSQL + pgvector)
   └─→ Importance score daily → L4
       ↓
7. L4 Long-Term (Qdrant vector DB)
   └─→ Pattern extraction weekly → L5
       ↓
8. L5 Semantic (knowledge representations)

At each step:
- Tag inheritance: Child tags include parent tags
- Access control: Based on tag visibility
- Deduplication: Content hash + timestamp
- Indexing: Full-text + vector + metadata
```

### Memory Read Flow

```
1. Agent queries for context
   ↓
2. Check L1 Working Memory (cached)
   ↓ L1 miss
3. Check L2 Short-Term (SQLite recent)
   ↓ L2 miss
4. Check L3 Medium-Term (PostgreSQL + semantic)
   ↓ L3 miss
5. Check L4 Long-Term (vector similarity)
   ↓ L4 miss
6. Check L5 Semantic (knowledge concepts)
   ↓
7. Merge and return ranked results
```

---

## Tag-Based Access Control

### Tag Hierarchy

```
nullclaw/
├── instance/
│   ├── atlas/         # Atlas instance data
│   │   ├── main/      # Main agent
│   │   ├── context/
│   │   └── research/
│   └── vigil/         # Vigil instance data
│       ├── main/
│       └── research/
├── access/
│   ├── public/        # Global access
│   ├── shared/        # Cross-instance
│   └── private/       # Instance-only
├── type/
│   ├── context/       # Contextual info
│   ├── action/        # Action items
│   ├── reference/     # Reference material
│   └── outcome/       # Task results
└── priority/
    ├── critical/
    ├── high/
    ├── normal/
    └── low/
```

### Visibility Rules

| Tag | Accessible By |
|-----|---------------|
| `atlas:public` | All instances and agents |
| `atlas:shared` | atlas + vigil instances (if shared) |
| `atlas:main:*` | atlas:main agent only |
| `atlas:private` | atlas instances only |
| `sensitive` | Requires explicit permit |

---

## Scalability Considerations

### Vertical Scaling (Single Machine)
- **Max agents:** 50-100
- **Max memory:** 100GB+ (SQLite + vector DB)
- **Limit:** CPU and I/O bound

### Horizontal Scaling (Distributed)
- **Max agents:** 1000+
- **Max memory:** Unlimited (sharding)
- **Method:** Instance + agent sharding

### Scaling Strategies

| Layer | Vertical | Horizontal | Notes |
|-------|----------|------------|-------|
| L1/L2 | ✓ | ✓ | In-process only |
| L3 | ✓ | ✓ | PostgreSQL replication |
| L4 | ✓ | ✓ | Qdrant sharding |
| L5 | ✓ | ✓ | Vector DB sharding |

---

## Cost Breakdown (Estimates)

### Local Deployment (Recommended for experiments)

| Component | Setup | Monthly | Notes |
|-----------|-------|---------|-------|
| PostgreSQL + pgvector | $0 | $0 | Self-hosted |
| Qdrant (Docker) | $0 | $0 | Self-hosted |
| Redis | $0 | $0 | Self-hosted |
| Embeddings (generate) | $0 | ~$5 | 1M/month |
| LLM (summarization) | $0 | ~$10 | Local first, API backup |
| **Total** | **$0** | **~$15** | For active dev |

### Cloud Deployment (Optional)

| Component | Setup | Monthly | Notes |
|-----------|-------|---------|-------|
| Qdrant Cloud | $0 | $29 | 1GB storage |
| Supabase (Postgres) | $0 | $0 | Free tier |
| Cloudflare R2 (backup) | $0 | ~$2 | 500GB transfer |
| **Total** | **$0** | **~$31** | For production |

---

## Service Recommendations

### Vector Database: Qdrant (Self-Hosted)
- **Why:** Open-source (MIT), Rust-based, efficient
- **Deployment:** Docker one-line setup
- **Cost:** Free for self-hosted
- **Features:** Filtering, payload indexing, replication

### Relational DB: PostgreSQL 16+ with pgvector
- **Why:** Mature, ACID-compliant, pgvector for semantic search
- **Deployment:** Brew/apt install
- **Cost:** Free
- **Features:** Full-text search, JSON support, triggers

### Cache: Redis
- **Why:** Pub/sub for real-time sync, key-value cache
- **Deployment:** Brew/apt install
- **Cost:** Free
- **Features:** Pub/sub, sorted sets, streams

### Backup: R2 or S3
- **Why:** Low-cost object storage for backups
- **Cost:** $0.015/GB/month (R2) or $0.023/GB (S3)

### Local-only Alternative (for experiments)
- **Vector:** ChromaDB (pure Python, no Docker required)
- **Embeddings:** Local models (nomic-embed-text-v1.5)
- **LLM:** Local models (Llama 3.3 via Ollama)

---

## Deployment Modes

### Mode 1: All Local (Experiments)
- **Pros:** Free, no network dependency, fastest
- **Cons:** Single machine limit, no redundancy
- **Use case:** Your current setup

### Mode 2: Hybrid Local + Cloud Backup
- **Pros:** Local speed, cloud durability, low cost
- **Cons:** Requires occasional sync
- **Use case:** Production experiments

### Mode 3: Fully Cloud
- **Pros:** Scalable, managed, redundant
- **Cons:** Monthly cost, latency
- **Use case:** Production deployment

---

## Migration Path

### Phase 1: Setup (Day 0)
1. Deploy PostgreSQL + pgvector locally
2. Deploy Qdrant locally
3. Deploy Redis locally
4. Create consolidation service

### Phase 2: Migrate (Week 1-2)
1. Export existing SQLite memories
2. Import to PostgreSQL with embeddings
3. Tag and classify existing data
4. Test sync between instances

### Phase 3: Optimize (Week 3-4)
1. Add importance scoring
2. Implement lifecycle policies
3. Add real-time sync via WebSocket
4. Configure backups

### Phase 4: Iterate (Ongoing)
1. Monitor memory growth
2. Adjust consolidation intervals
3. Optimize embedding cache
4. Tune vector search parameters

---

## Monitoring and Observability

### Metrics to Track

| Metric | Alert Threshold | Notes |
|--------|----------------|-------|
| DB size | >10GB | Trigger archival |
| Memory query latency | >500ms | Check indexes |
| Embedding cache hit rate | <50% | Add more pre-embedding |
| Consolidation lag | >2 hours | Check service health |
| Cross-instance sync lag | >5s | Check network |
| Vector DB size | >5GB | Trigger cleanup |

### Dashboard Recommendations

| Area | Open Source Tool |
|------|------------------|
| Metrics | Prometheus + Grafana |
| Logs | Loki |
| Tracing | Jaeger (optional) |
| UI | React admin panel |

---

## Next Steps for Implementation

1. **Confirm technology choices** (Qdrant + PostgreSQL + Redis)
2. **Set up local infrastructure** (Docker Compose)
3. **Create consolidation service** (Node.js/TypeScript)
4. **Migrate existing data** with proper tagging
5. **Implement real-time sync** (WebSocket + Pub/Sub)
6. **Add monitoring** (Prometheus + Grafana)
7. **Test scale** with increasing agents/sessions

---

## Summary

This architecture provides:

- **5-layer memory hierarchy** for optimal resource usage
- **Self-hosted primary storage** for zero monthly cost
- **Real-time sync** via WebSocket + Redis_pub/sub
- **Tag-based access control** for multi-instance security
- **Automatic consolidation** for memory lifecycle management
- **Scalable design** from 1 to 1000+ agents
- **Estimated cost:** $0 setup + ~$15/month (local) or ~$31/month (cloud)

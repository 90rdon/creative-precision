# Technology Decision Matrix

## Vector Database Comparison

| Database | Deployment | Cost | Pros | Cons | Recommendation |
|----------|------------|------|------|------|----------------|
| **Qdrant** | Self-hosted Docker | Free | • Rust-based, efficient<br>• Great filtering<br>• Easy Docker setup<br>• Open-source (MIT) | • Requires Docker | **Best for hybrid** |
| **ChromaDB** | Self-hosted Python | Free | • Pure Python, no Docker<br>• Simple API<br>• Good for experiments | • Slower on large datasets<br>• Less mature | Good for quick POC |
| **pgvector** | PostgreSQL extension | Free | • Native PostgreSQL<br>• SQL-based queries<br>• Good integration | • Limited features vs dedicated | Good alternative |
| **Pinecone** | Cloud only | $70+/mo | • Managed service<br>• High performance | • Expensive<br>• Cloud-only | Skip for experiments |

### Verdict: **Qdrant (self-hosted)**

Reasons:
1. Rust-based (fast, efficient)
2. MIT license (no licensing concerns)
3. Great metadata filtering support
4. Easy Docker deployment
5. Best balance of features and simplicity

---

## Relational Database Comparison

| Database | Deployment | Cost | Pros | Cons | Recommendation |
|----------|------------|------|------|------|----------------|
| **PostgreSQL 16+** | Self-hosted | Free | • Mature, reliable<br>• pgvector extension<br>• JSON support<br>• FT5 full-text search | • Slightly heavier than SQLite | **Recommended** |
| **SQLite** | Embedded file | Free | • Zero-configuration<br>• Fast for small DB<br>• Simple | • No native replication<br>• Limited concurrency | Good for small scale |
| **MySQL/MariaDB** | Self-hosted | Free | • Popular<br>• Mature | • No good vector extension | Not recommended |

### Verdict: **PostgreSQL 16+ with pgvector**

Reasons:
1. pgvector extensions for semantic search
2. Mature and battle-tested
3. Great JSON support
4. FT5 for full-text search (you already use this)

---

## Caching Layer Comparison

| Technology | Deployment | Cost | Pros | Cons | Recommendation |
|------------|------------|------|------|------|----------------|
| **Redis** | Self-hosted | Free | • Pub/sub for real-time<br>• Sorted sets<br>• Streams | • Memory-first (needs RAM) | **Recommended** |
| **Memcached** | Self-hosted | Free | • Simple<br>• Fast | • Limited features | No |

### Verdict: **Redis**

Reasons:
1. Pub/sub for real-time memory sync
2. Sorted sets for time-based queries
3. Streams for event processing
4. Mature ecosystem

---

## Embedding Model Comparison

| Model | Cost | Dimensions | Speed | Recommendation |
|-------|------|------------|-------|----------------|
| **text-embedding-3-small** | $0.02/1M tokens | 1536 | Fast | **Best for API based** |
| **nomic-embed-text-v1.5** | $0 (local) | 768 | Moderate | **Best for local** |
| **openai/text-embedding-ada-002** | $0.10/1M tokens | 1536 | Fast | Legacy |

### Verdict for Your Case:

| Scenario | Model | Reason |
|----------|-------|--------|
| **Production (cost)** | nomic-embed-text-v1.5 (local) | Free, adequate quality |
| **Production (quality)** | text-embedding-3-small | Better performance, inexpensive |
| **Hybrid** | nomic + OpenAI fallback | Cache local, fallback to API |

**Local embedding option:** `nomic-ai/nomic-embed-text-v1.5:free` via OpenRouter (free tier)

---

## LLM Comparison for Summarization

| Model | Cost | Context | Quality | Recommendation |
|-------|------|---------|---------|----------------|
| **Llama 3.3 70B (local)** | Hardware cost | 128K | Very Good | **Best for local** |
| **Qwen 2.5 7B (local)** | Hardware cost | 128K | Good | Good summary |
| **GPT-4** | $30/1M tokens | 128K | Excellent | Too expensive |

### Verdict: **Local models first, API fallback**

You already have local models configured. Use:
1. Llama 3.3 70B for complex summarization
2. Qwen 2.5 7B for quick summaries
3. GPT-4 API only for edge cases

---

## Backup/Archive Solutions

| Service | Cost | Pros | Cons | Recommendation |
|---------|------|------|------|----------------|
| **Cloudflare R2** | $0.015/GB/mo | • S3-compatible<br>• Free egress<br>• Fast | Newer ecosystem | **Recommended** |
| **AWS S3 Glacier** | $0.003/GB/mo | • Cheap<br>• Durable | Slow retrieval | For cold storage |
| **B2 Backblaze** | $0.005/GB/mo | • Cheap<br>• Reliable | Slower than R2 | Good option |

### Verdict: **Cloudflare R2 for hot backup, S3 Glacier for cold**

---

## Infrastructure Options

### Option A: Local Only (Recommended for Experiments)

**Cost:** $0 setup + ~$15/month (embeddings/LLM)

| Component | How |
|-----------|-----|
| Vector DB | Qdrant (Docker) |
| Relational DB | PostgreSQL + pgvector (Brew/apt) |
| Cache | Redis (Brew/apt) |
| Backup | Local rsync + Cloudflare R2 |
| Sync | WebSocket server on Mac |

**Pros:** Free, fast, no network issues
**Cons:** Single point of failure, no redundancy

### Option B: Hybrid Local + Cloud

**Cost:** ~$15/month (R2 storage) + $15 (embeddings) = ~$30/month

| Component | How |
|-----------|-----|
| Vector DB | Qdrant (local) + Qdrant Cloud (replica) |
| Relational DB | PostgreSQL (local) + Supabase (cloud) |
| Cache | Redis (local) + Upstash (cloud) |
| Backup | Cloudflare R2 primary + S3 Glacier secondary |

**Pros:** Local speed, cloud durability
**Cons:** More complexity

### Option C: Cloud Only

**Cost:** ~$100+/month

| Component | How |
|-----------|-----|
| Vector DB | Qdrant Cloud or Pinecone |
| Relational DB | Supabase or Neon |
| Cache | Redis Cloud or Upstash |
| Backup | Built-in to providers |

**Pros:** Managed, scalable
**Cons:** Expensive, latency

---

## Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED TECH STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Storage Layer:                                                   │
│  ├─ Vector DB      → Qdrant (Docker, self-hosted)                │
│  ├─ Relational DB  → PostgreSQL 16 + pgvector                    │
│  ├─ Cache          → Redis (self-hosted)                         │
│  └─ Archive        → Cloudflare R2 (hot) + S3 Glacier (cold)     │
│                                                                   │
│  Processing Layer:                                                │
│  ├─ Embeddings     → nomic-embed-text-v1.5 (free via OpenRouter)  │
│  ├─ Summarization  → Llama 3.3 70B (local) + API fallback        │
│  └─ Sync           → WebSocket + Redis Pub/Sub                  │
│                                                                   │
│  Application Layer:                                               │
│  ├─ Backend       → Node.js/TypeScript                          │
│  ├─ Frontend      → React (optional admin UI)                    │
│  └─ Monitoring    → Prometheus + Grafana                         │
│                                                                   │
│  Deployment:                                                      │
│  ├─ Local        → Docker Compose                               │
│  ├─ Sync Service → TypeScript service                           │
│  └─ Cron Jobs   → Node cron scheduler                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

### 1. Install Dependencies

```bash
# On Mac
brew install postgresql@16 pgvector redis-server

# On Linux (Vigil)
sudo apt-get install postgresql-16 pgvector-16 redis-server

# Start services
brew services start postgresql@16 redis-server
# or
sudo systemctl start postgresql redis
```

### 2. Start Vector DB

```bash
# Pull and run Qdrant
docker run -p 6333:6333 -v ~/qdrant:/qdrant/storage qdrant/qdrant
```

### 3. Enable pgvector

```bash
# Enable extension
psql -d nullclaw -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify
psql -d nullclaw -c "\dx"
```

### 4. Initialize Database Schema

```bash
# Create database
psql -c "CREATE DATABASE nullclaw;"

# Run schema migration
psql -d nullclaw -f memory-architecture/schema/pg_schema.sql
```

### 5. Redis Configuration

```bash
# Edit config if needed
vim /usr/local/etc/redis.conf  # Mac
# or
vim /etc/redis/redis.conf      # Linux

# Start Redis
redis-server
```

---

## Memory Size Projections

| Agents | Memories | Embeddings | Storage | Monthly Cost |
|--------|----------|------------|---------|--------------|
| 5      | 10K      | 10K        | ~1GB    | $0 |
| 20     | 100K     | 100K       | ~10GB   | $0 |
| 100    | 1M       | 1M         | ~100GB  | ~$5 (embeddings) |
| 500    | 5M       | 5M         | ~500GB  | ~$25 |
| 1000+  | 10M+     | 10M+       | ~1TB    | ~$50 |

Note: With proper TTL and archival, actual storage will be much lower.

---

## Decision Checklist

- [ ] Vector DB: Qdrant (self-hosted)
- [ ] Relational DB: PostgreSQL 16 + pgvector
- [ ] Cache: Redis
- [ ] Embeddings: nomic-embed-text-v1.5 (local/free)
- [ ] Summarization: Llama 3.3 70B (local)
- [ ] Backup: Cloudflare R2
- [ ] Archive: S3 Glacier
- [ ] Deploy: Docker Compose local
- [ ] Sync: WebSocket + Redis Pub/Sub
- [ ] Monitoring: Prometheus + Grafana (optional)

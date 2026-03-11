/**
 * AIEOS Store — JSON-based persistence (no external DB required)
 *
 * Files:
 *   data/instances.json    — registered agent instances
 *   data/personas.json     — persona configurations
 *   data/relationships.json — agent relationships
 *   data/state.json        — agent state fragments
 *   data/events.json       — event log
 *   data/sim-jobs.json     — simulation job records
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface AgentInstance {
  id: string;
  type: string;
  endpoint: string;
  token: string;
  environment: string;
  metadata: object;
  status: string;
  lastSeen: string;
  createdAt: string;
}

interface Persona {
  instanceId: string;
  personaId: string;
  name: string;
  dna?: string;
  configuration?: object;
  updatedAt: string;
}

interface Relationship {
  source: { instanceId: string; agentId: string };
  target: { instanceId: string; agentId: string };
  type: string;
  createdAt: string;
}

interface StateFragment {
  id: string;
  instanceId: string;
  agentId: string;
  key: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

interface EventRecord {
  id: string;
  instanceId: string;
  agentId: string;
  eventType: string;
  category: string;
  severity: string;
  title: string;
  description?: string;
  metadata: object;
  createdAt: string;
}

interface SimJobRecord {
  id: string;
  personaId: string;
  strategy: string;
  status: string;
  turnsCompleted: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  sessionScore?: object;
}

interface DataStore {
  instances: AgentInstance[];
  personas: Persona[];
  relationships: Relationship[];
  state: StateFragment[];
  events: EventRecord[];
  simJobs: SimJobRecord[];
}

export class Store {
  private dataDir: string;
  private data: DataStore;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    mkdirSync(dataDir, { recursive: true });
    this.data = this.load();
  }

  private filePath(name: string): string {
    return join(this.dataDir, `${name}.json`);
  }

  private load(): DataStore {
    const defaults: DataStore = {
      instances: [],
      personas: [],
      relationships: [],
      state: [],
      events: [],
      simJobs: [],
    };
    const keys = Object.keys(defaults) as (keyof DataStore)[];
    for (const key of keys) {
      const file = this.filePath(key === 'simJobs' ? 'sim-jobs' : key);
      if (existsSync(file)) {
        try {
          (defaults[key] as any[]) = JSON.parse(readFileSync(file, 'utf8'));
        } catch {
          /* leave default */
        }
      }
    }
    return defaults;
  }

  private persist(key: keyof DataStore): void {
    const filename = key === 'simJobs' ? 'sim-jobs' : key;
    writeFileSync(this.filePath(filename), JSON.stringify(this.data[key], null, 2), 'utf8');
  }

  // ── Instances ──────────────────────────────────────────────────────────────

  listInstances(): AgentInstance[] {
    return this.data.instances;
  }

  getInstance(id: string): AgentInstance | undefined {
    return this.data.instances.find((i) => i.id === id);
  }

  upsertInstance(instance: AgentInstance): AgentInstance {
    const idx = this.data.instances.findIndex((i) => i.id === instance.id);
    if (idx >= 0) {
      this.data.instances[idx] = { ...this.data.instances[idx], ...instance };
    } else {
      this.data.instances.push(instance);
    }
    this.persist('instances');
    return instance;
  }

  // ── Personas ───────────────────────────────────────────────────────────────

  listPersonas(instanceId?: string): Persona[] {
    return instanceId
      ? this.data.personas.filter((p) => p.instanceId === instanceId)
      : this.data.personas;
  }

  upsertPersona(persona: Persona): Persona {
    const idx = this.data.personas.findIndex(
      (p) => p.instanceId === persona.instanceId && p.personaId === persona.personaId,
    );
    if (idx >= 0) {
      this.data.personas[idx] = { ...this.data.personas[idx], ...persona };
    } else {
      this.data.personas.push(persona);
    }
    this.persist('personas');
    return persona;
  }

  // ── Relationships ─────────────────────────────────────────────────────────

  defineRelationship(rel: Relationship): Relationship {
    this.data.relationships.push(rel);
    this.persist('relationships');
    return rel;
  }

  // ── State Fragments ────────────────────────────────────────────────────────

  saveState(fragment: StateFragment): StateFragment {
    this.data.state.push(fragment);
    // Keep last 1000 fragments
    if (this.data.state.length > 1000) {
      this.data.state = this.data.state.slice(-1000);
    }
    this.persist('state');
    return fragment;
  }

  queryState(instanceId: string, agentId: string, query: string, limit: number): StateFragment[] {
    const terms = query.toLowerCase().split(/\s+/);
    return this.data.state
      .filter((s) => {
        if (s.instanceId !== instanceId || s.agentId !== agentId) return false;
        const text = `${s.key} ${s.content} ${s.category} ${s.tags.join(' ')}`.toLowerCase();
        return terms.some((t) => text.includes(t));
      })
      .slice(-limit)
      .reverse();
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  logEvent(event: EventRecord): EventRecord {
    this.data.events.push(event);
    // Keep last 5000 events
    if (this.data.events.length > 5000) {
      this.data.events = this.data.events.slice(-5000);
    }
    this.persist('events');
    return event;
  }

  getRecentEvents(limit = 50, category?: string): EventRecord[] {
    const filtered = category
      ? this.data.events.filter((e) => e.category === category)
      : this.data.events;
    return filtered.slice(-limit).reverse();
  }

  // ── Simulation Jobs ────────────────────────────────────────────────────────

  upsertSimJob(job: SimJobRecord): SimJobRecord {
    const idx = this.data.simJobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.simJobs[idx] = { ...this.data.simJobs[idx], ...job };
    } else {
      this.data.simJobs.push(job);
    }
    this.persist('simJobs');
    return job;
  }

  listSimulationJobs(statusFilter?: string, limit = 20): SimJobRecord[] {
    const filtered = statusFilter && statusFilter !== 'all'
      ? this.data.simJobs.filter((j) => j.status === statusFilter)
      : this.data.simJobs;
    return filtered.slice(-limit).reverse();
  }

  getSimulationInsights(personaId?: string, sinceHours = 24): object {
    const cutoff = new Date(Date.now() - sinceHours * 3600_000).toISOString();
    const jobs = this.data.simJobs.filter(
      (j) =>
        j.status === 'completed' &&
        j.startedAt >= cutoff &&
        (!personaId || j.personaId === personaId),
    );

    if (jobs.length === 0) {
      return { period_hours: sinceHours, jobs_analyzed: 0, message: 'No completed jobs in period.' };
    }

    // Aggregate dimension scores
    const dimAccum: Record<string, number[]> = {};
    let passCount = 0;
    let failCount = 0;
    let partialCount = 0;
    let secondLayerCount = 0;
    let disengagedCount = 0;
    const recommendations: string[] = [];

    for (const job of jobs) {
      const score = job.sessionScore as any;
      if (!score) continue;

      if (score.verdict === 'PASS') passCount++;
      else if (score.verdict === 'FAIL') failCount++;
      else partialCount++;

      if (score.secondLayerReached) secondLayerCount++;
      if (score.recommendation?.includes('disengaged')) disengagedCount++;

      recommendations.push(score.recommendation);

      if (score.aggregate) {
        for (const [dim, val] of Object.entries(score.aggregate)) {
          if (!dimAccum[dim]) dimAccum[dim] = [];
          dimAccum[dim].push(val as number);
        }
      }
    }

    const avgDimensions: Record<string, number> = {};
    for (const [dim, vals] of Object.entries(dimAccum)) {
      avgDimensions[dim] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }

    const weakestDims = Object.entries(avgDimensions)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([k, v]) => ({ dimension: k, avg_score: parseFloat(v.toFixed(2)) }));

    return {
      period_hours: sinceHours,
      jobs_analyzed: jobs.length,
      verdict_breakdown: { PASS: passCount, FAIL: failCount, PARTIAL: partialCount },
      second_layer_reached_rate: `${Math.round((secondLayerCount / jobs.length) * 100)}%`,
      early_disengage_rate: `${Math.round((disengagedCount / jobs.length) * 100)}%`,
      average_dimensions: avgDimensions,
      weakest_dimensions: weakestDims,
      top_recommendations: [...new Set(recommendations)].slice(0, 5),
    };
  }

  // ── Fleet Dashboard ────────────────────────────────────────────────────────

  getFleetDashboard(): object {
    const recentJobs = this.listSimulationJobs('all', 5);
    const recentEvents = this.getRecentEvents(10);
    const insights24h = this.getSimulationInsights(undefined, 24);

    return {
      generated_at: new Date().toISOString(),
      instances: this.data.instances.map((i) => ({
        id: i.id,
        type: i.type,
        status: i.status,
        environment: i.environment,
        last_seen: i.lastSeen,
      })),
      personas_registered: this.data.personas.length,
      relationships: this.data.relationships.length,
      simulation_summary_24h: insights24h,
      recent_jobs: recentJobs.map((j) => ({
        id: j.id,
        persona: j.personaId,
        strategy: j.strategy,
        status: j.status,
        turns: j.turnsCompleted,
        score: (j.sessionScore as any)?.compositeAverage?.toFixed(2) ?? null,
        verdict: (j.sessionScore as any)?.verdict ?? null,
      })),
      recent_events: recentEvents.map((e) => ({
        type: e.eventType,
        severity: e.severity,
        title: e.title,
        agent: e.agentId,
        at: e.createdAt,
      })),
    };
  }
}

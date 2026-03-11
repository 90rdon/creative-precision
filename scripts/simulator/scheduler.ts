/**
 * Scheduler Service — Cron-Based Simulation Scheduling
 *
 * Manages scheduled simulation jobs using cron expressions.
 * Stores jobs locally in JSON format.
 */

import { personas } from './icp-personas.js';
import { runBatch, SimulationStrategy } from './simulator-runner.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

const SCHEDULES_FILE = path.join(process.cwd(), 'simulator-schedules.json');

export interface ScheduleJob {
  id: string;
  expression: string;
  strategy: SimulationStrategy;
  icp?: number | null;
  maxTurns?: number;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
  createdAt: string;
}

/**
 * Read schedules from storage
 */
function readSchedules(): ScheduleJob[] {
  if (!existsSync(SCHEDULES_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(SCHEDULES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write schedules to storage
 */
function writeSchedules(schedules: ScheduleJob[]): void {
  writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
}

/**
 * Parse cron expression to description
 */
function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [minute, hour, day, month, weekday] = parts;

  // Simple patterns
  if (hour === '*' && minute === '0') {
    if (day === '*') return 'Every hour';
    if (day === '*/6') return 'Every 6 hours';
  }

  if (hour === '9,13,17' && minute === '0' && day === '*') {
    return '9am, 1pm, 5pm daily';
  }

  if (minute === '0' && hour === '0' && day === '*' && weekday === '1') {
    return 'Every Monday at midnight';
  }

  if (minute === '0' && hour === '9' && day === '*'') {
    return '9am daily';
  }

  return expr;
}

/**
 * Calculate next run time from cron expression (simplified)
 */
function calculateNextRun(expr: string): string {
  // For now, just use a placeholder. In production, use a cron library.
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toISOString();
}

/**
 * Parse rate string to cron expression
 */
export function rateToCron(rate: string): string {
  // "10-per-hour" -> every 6 minutes
  const perHourMatch = rate.match(/^(\d+)-per-hour$/i);
  if (perHourMatch) {
    const count = parseInt(perHourMatch[1], 10);
    const minutes = Math.floor(60 / count);
    if (minutes === 60) return '0 * * * *';
    if (minutes === 30) return '0,30 * * * *';
    if (minutes === 20) return '0,20,40 * * * *';
    if (minutes === 15) return '0,15,30,45 * * * *';
    if (minutes === 12) return '0,12,24,36,48 * * * *';
    if (minutes === 10) return '0,10,20,30,40,50 * * * *';
    if (minutes === 6) return '0,6,12,18,24,30,36,42,48,54 * * * *';
  }

  // Return as-is if already a cron expression
  return rate;
}

/**
 * Create a new scheduled job
 */
export async function scheduleCron(opts: {
  expression: string;
  strategy: SimulationStrategy;
  icp?: number | null;
  maxTurns?: number;
}): Promise<void> {
  const schedules = readSchedules();

  const job: ScheduleJob = {
    id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    expression: opts.expression,
    strategy: opts.strategy,
    icp: opts.icp ?? null,
    maxTurns: opts.maxTurns ?? 6,
    nextRun: calculateNextRun(opts.expression),
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  schedules.push(job);
  writeSchedules(schedules);

  const description = describeCron(opts.expression);
  console.log('✅ Schedule created');
  console.log(`   ID: ${job.id}`);
  console.log(`   Expression: ${opts.expression}`);
  console.log(`   Description: ${description}`);
  console.log(`   Next run: ${job.nextRun}`);
  console.log('\nNote: This is a manual implementation. For production, use node-cron or similar.\n');
}

/**
 * List all scheduled jobs
 */
export async function listSchedules(): Promise<void> {
  const schedules = readSchedules();

  if (schedules.length === 0) {
    console.log('No scheduled jobs.\n');
    console.log('To create a schedule:');
    console.log('  npx tsx cli.ts schedule "0 */6 * * *"\n');
    return;
  }

  console.log('Scheduled Simulation Jobs');
  console.log('='.repeat(80) + '\n');

  schedules.forEach((job, i) => {
    const description = describeCron(job.expression);
    const personaFilter = job.icp ? `(ICP ${job.icp} only)` : '(all personas)';

    console.log(`[${i + 1}] ID: ${job.id}`);
    console.log(`     Expression: ${job.expression}`);
    console.log(`     Description: ${description}`);
    console.log(`     Personas: ${personaFilter}`);
    console.log(`     Strategy: ${job.strategy}`);
    console.log(`     Next run: ${job.nextRun ?? 'pending'}`);
    console.log(`     Status: ${job.enabled ? 'enabled' : 'disabled'}`);
    console.log(`     Created: ${job.createdAt}\n`);
  });

  console.log(`Total: ${schedules.length} scheduled job(s)\n`);
  console.log('To remove a job: npx tsx cli.ts schedule --remove <job-id>');
  console.log('To list all IDs: npx tsx cli.ts schedule --list\n');
}

/**
 * Remove a scheduled job
 */
export async function removeSchedule(id: string): Promise<void> {
  const schedules = readSchedules();
  const index = schedules.findIndex((s) => s.id === id);

  if (index === -1) {
    console.error(`❌ Schedule not found: ${id}\n`);
    console.log('To list all schedule IDs, run: npx tsx cli.ts schedule --list\n');
    process.exit(1);
  }

  schedules.splice(index, 1);
  writeSchedules(schedules);

  console.log('✅ Schedule removed');
  console.log(`   ID: ${id}\n`);
}

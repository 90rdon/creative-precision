/**
 * Daemon Service — Continuous Background Execution
 *
 * Runs simulations continuously or at a specified rate:
 *   - N-per-hour: Run N simulations per hour
 *   - cron expression: Schedule via cron syntax
 */

import { personas } from './icp-personas.js';
import { runSimulation, SimulationStrategy } from './simulator-runner.js';
import { setInterval, clearInterval } from 'timers';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const DAEMON_PID_FILE = path.join(process.cwd(), 'simulator-daemon.pid');
const DAEMON_LOG_FILE = path.join(process.cwd(), 'simulator-daemon.log');

export interface DaemonOptions {
  rate: string; // e.g., "10-per-hour", "0 */6 * * *"
  icp?: number | null; // Filter by ICP
}

let daemonRunning = false;
let daemonInterval: ReturnType<typeof setInterval> | null = null;
let simulationCount = 0;

/**
 * Start background daemon
 */
export async function startDaemon(opts: DaemonOptions): Promise<void> {
  // Check if already running
  if (isDaemonRunning()) {
    console.error('❌ Daemon is already running. Use "daemon stop" first.');
    process.exit(1);
  }

  // Parse rate
  const intervalMs = parseRateToInterval(opts.rate);
  if (!intervalMs) {
    console.error(`❌ Invalid rate: ${opts.rate}`);
    console.error('  Use "N-per-hour" or a valid cron expression');
    process.exit(1);
  }

  // Filter personas by ICP
  let personaList = personas.map((p) => p.id);
  if (opts.icp && opts.icp >= 1 && opts.icp <= 3) {
    personaList = personas.filter((p) => p.icp === opts.icp).map((p) => p.id);
  }

  // Start async process (fork background)
  const { spawn } = await import('child_process');
  const child = spawn(process.execPath, [process.argv[1], '--daemon-worker', '--rate', opts.rate, opts.icp ? `--icp ${opts.icp}` : ''], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

  // Write PID file
  writeFileSync(DAEMON_PID_FILE, child.pid.toString());

  console.log('✅ Daemon started in background');
  console.log(`   PID: ${child.pid}`);
  console.log(`   Rate: ${opts.rate}`);
  console.log(`   Logs: ${DAEMON_LOG_FILE}`);
  console.log('\nTo stop the daemon, run: npx tsx cli.ts daemon --stop\n');
}

/**
 * Stop background daemon
 */
export async function stopDaemon(): Promise<void> {
  if (!existsSync(DAEMON_PID_FILE)) {
    console.log('ℹ️  Daemon is not running.');
    return;
  }

  const pid = parseInt(readFileSync(DAEMON_PID_FILE, 'ascii'));

  try {
    process.kill(pid);
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    // Process may already be dead
  }

  unlinkIfExists(DAEMON_PID_FILE);
  console.log('✅ Daemon stopped.');
}

/**
 * Check if daemon is running
 */
function isDaemonRunning(): boolean {
  if (!existsSync(DAEMON_PID_FILE)) return false;

  try {
    const pid = parseInt(readFileSync(DAEMON_PID_FILE, 'ascii'));
    process.kill(pid, 0); // Signal 0 checks if process exists
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse rate string to interval in milliseconds
 */
function parseRateToInterval(rate: string): number | null {
  // Check for "N-per-hour" format
  const perHourMatch = rate.match(/^(\d+)-per-hour$/i);
  if (perHourMatch) {
    const count = parseInt(perHourMatch[1], 10);
    return Math.floor((60 * 60 * 1000) / Math.max(1, count));
  }

  // Parse cron expression (simplified - only handles hourly/daily patterns for now)
  const hourlyCron = rate.match(/^0 \* \* \* \*$/);
  if (hourlyCron) return 60 * 60 * 1000;

  const sixHourCron = rate.match(/^0 \/\*6 \* \* \*$/);
  if (sixHourCron) return 6 * 60 * 60 * 1000;

  return null;
}

/**
 * Daemon worker - runs in background process
 */
export async function daemonWorker(opts: DaemonOptions): Promise<void> {
  daemonRunning = true;
  simulationCount = 0;

  // Open log file
  const logStream = {
    write: (msg: string) => {
      const timestamp = new Date().toISOString();
      writeFileSync(DAEMON_LOG_FILE, `[${timestamp}] ${msg}\n`, { flag: 'a' });
    },
  };

  logStream.write('Daemon started');

  const intervalMs = parseRateToInterval(opts.rate)!;
  if (!intervalMs) {
    logStream.write('Invalid rate format');
    process.exit(1);
  }

  // Run loop
  daemonInterval = setInterval(async () => {
    try {
      // Pick random persona
      const filteredPersonas = opts.icp
        ? personas.filter((p) => p.icp === opts.icp)
        : personas;

      const persona = filteredPersonas[Math.floor(Math.random() * filteredPersonas.length)];

      logStream.write(`Running simulation ${++simulationCount} for ${persona.name} (${persona.id})`);

      // Run simulation (suppress console output in daemon mode)
      const originalLog = console.log;
      console.log = () => {}; // Suppress

      await runSimulation({
        personaId: persona.id,
        strategy: 'standard' as SimulationStrategy,
        maxTurns: 6,
      });

      console.log = originalLog; // Restore

      logStream.write(`Simulation ${simulationCount} completed`);
    } catch (err) {
      logStream.write(`Simulation ${simulationCount} failed: ${(err as Error).message}`);
    }
  }, intervalMs);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logStream.write('Daemon stopping on SIGTERM');
    if (daemonInterval) clearInterval(daemonInterval);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logStream.write('Daemon stopping on SIGINT');
    if (daemonInterval) clearInterval(daemonInterval);
    process.exit(0);
  });
}

/**
 * Helper to unlink if exists
 */
function unlinkIfExists(filepath: string): void {
  try {
    import('fs').then(({ unlinkSync }) => unlinkSync(filepath));
  } catch {
    // Ignore
  }
}

// Worker entry point
if (process.argv.includes('--daemon-worker')) {
  const rateIndex = process.argv.indexOf('--rate');
  const icpIndex = process.argv.indexOf('--icp');

  const rate = rateIndex >= 0 ? process.argv[rateIndex + 1] : '10-per-hour';
  const icp = icpIndex >= 0 ? parseInt(process.argv[icpIndex + 1], 10) : undefined;

  daemonWorker({ rate, icp: icp ?? null }).catch(console.error);
}

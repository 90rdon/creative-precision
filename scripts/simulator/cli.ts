#!/usr/bin/env tsx
/**
 * Simulator CLI — Phase 4 Interface
 *
 * Commands:
 *   npx tsx cli.ts run [persona] [options]    - Run N simulations
 *   npx tsx cli.ts batch [options]            - Run all personas
 *   npx tsx cli.ts daemon [options]           - Continuous background mode
 *   npx tsx cli.ts schedule [cron] [options]  - Schedule simulations
 *   npx tsx cli.ts analyze [options]          - Analyze recent simulations
 *   npx tsx cli.ts insights [options]         - View learning insights
 *   npx tsx cli.ts metrics [options]          - View learning metrics
 *   npx tsx cli.ts personas                   - List all personas
 *
 * Environment variables:
 *   NULLCLAW_GATEWAY_URL   - Webhook endpoint (default: https://nullclaw-cloud.tail4bf23a.ts.net)
 *   NULLCLAW_TOKEN         - Bearer token
 *   OPENROUTER_API_KEY     - For ICP agent + evaluator
 *   DATABASE_URL           - Postgres for metrics storage
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { runSimulation, runBatch, personas, getPersona, SimulationStrategy } from './simulator-runner.js';
import { analyzeSimulations, generatePromptSuggestions } from './analysis.js';
import { getInsights, getMetrics } from './metrics.js';
import { startDaemon, stopDaemon } from './daemon.js';
import { scheduleCron, listSchedules, removeSchedule } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const program = new Command();

program
  .name('simulator')
  .description('NullClaw Expert Simulator — Phase 4 Learning Loop')
  .version('1.0.0');

// ─── RUN: Single or Multiple Simulations ─────────────────────────────────

program
  .command('run')
  .description('Run simulation(s) for a specific persona')
  .argument('[persona]', 'Persona ID (e.g., icp1-A, icp2-B). Omit to list personas.')
  .option('-c, --count <number>', 'Number of simulations', '1')
  .option('-s, --strategy <strategy>', 'Simulation strategy', 'standard')
  .option('-t, --max-turns <number>', 'Maximum turns per simulation', '6')
  .option('-v, --verbose', 'Verbose output')
  .action(async (personaId, options) => {
    const count = parseInt(options.count, 10);

    if (!personaId) {
      console.log('\n📋 Available Personas:\n');
      personas.forEach((p) => {
        const icpLabel = `(ICP ${p.icp}, Variant ${p.variant})`;
        console.log(`  ${p.id.padEnd(10)}  ${p.name.padEnd(20)}  ${icpLabel}`);
      });
      console.log(`\nExample: npx tsx cli.ts run icp1-A --count 5\n`);
      return;
    }

    const persona = getPersona(personaId);
    if (!persona) {
      console.error(`❌ Unknown persona: ${personaId}\nRun without arguments to list personas.`);
      process.exit(1);
    }

    console.log(`\n🎭 Running ${count} simulation(s) for ${persona.name} (${persona.title})`);
    console.log(`   Strategy: ${options.strategy} | Max turns: ${options.maxTurns}\n`);

    for (let i = 0; i < count; i++) {
      if (i > 0 && !options.verbose) {
        console.log(`\n[Simulation ${i + 1}/${count}]...`);
      }
      await runSimulation({
        personaId,
        strategy: options.strategy as SimulationStrategy,
        maxTurns: parseInt(options.maxTurns, 10),
      });
    }
  });

// ─── BATCH: Run All Personas ───────────────────────────────────────────────

program
  .command('batch')
  .description('Run simulations for all personas')
  .option('-s, --strategy <strategy>', 'Simulation strategy', 'standard')
  .option('-t, --max-turns <number>', 'Maximum turns per simulation', '6')
  .option('--icp <number>', 'Filter by ICP (1, 2, 3, or 0 for all)')
  .action(async (options) => {
    let personaIds = personas.map((p) => p.id);
    if (options.icp) {
      const icp = parseInt(options.icp, 10);
      if (icp > 0 && icp <= 3) {
        personaIds = personas.filter((p) => p.icp === icp).map((p) => p.id);
      }
    }

    console.log(`\n📦 Running batch simulation for ${personaIds.length} persona(s)\n`);

    await runBatch({
      personaIds,
      strategy: options.strategy as SimulationStrategy,
      maxTurns: parseInt(options.maxTurns, 10),
    });
  });

// ─── DAEMON: Continuous Background Mode ────────────────────────────────────

program
  .command('daemon')
  .description('Run or manage continuous background daemon')
  .option('-r, --rate <expression>', 'Rate: N-per-hour or cron expression')
  .option('--icp <number>', 'Filter by ICP')
  .option('--stop', 'Stop the running daemon')
  .action(async (options) => {
    if (options.stop) {
      await stopDaemon();
      return;
    }
    const rate = options.rate ?? '10-per-hour';
    console.log(`\n🤖 Starting daemon with rate: ${rate}\n`);
    await startDaemon({ rate, icp: options.icp ? parseInt(options.icp, 10) : null });
  });

// ─── SCHEDULE: Cron-Based Scheduling ─────────────────────────────────────

program
  .command('schedule')
  .description('Schedule or manage simulation runs')
  .argument('[cron]', 'Cron expression (e.g., "0 */6 * * *" for every 6 hours)')
  .option('-s, --strategy <strategy>', 'Simulation strategy', 'standard')
  .option('--icp <number>', 'Filter by ICP')
  .option('--list', 'List scheduled jobs')
  .option('--remove <id>', 'Remove a scheduled job by ID')
  .action(async (cronExpr, options) => {
    if (options.list) {
      await listSchedules();
      return;
    }

    if (options.remove) {
      await removeSchedule(options.remove);
      return;
    }

    if (!cronExpr) {
      console.error('Usage: simulator schedule <cron-expression>');
      console.error('Examples:');
      console.error('  "0 */6 * * *"   - Every 6 hours');
      console.error('  "0 9,13,17 * * *" - 9am, 1pm, 5pm daily');
      console.error('  "0 0 * * 1"     - Every Monday at midnight');
      process.exit(1);
    }

    await scheduleCron({
      expression: cronExpr,
      strategy: options.strategy as SimulationStrategy,
      icp: options.icp ? parseInt(options.icp, 10) : null,
      maxTurns: 6
    });
  });

// ─── ANALYZE: Post-Simulation Analysis ────────────────────────────────────

program
  .command('analyze')
  .description('Analyze recent simulations for weak points')
  .option('--since <hours>', 'Look back N hours', '24')
  .option('--persona <id>', 'Filter by persona ID')
  .option('--output <file>', 'Output to file')
  .option('--json', 'JSON output format')
  .action(async (options) => {
    const hours = parseInt(options.since, 10);
    const personasFilter = options.persona ? [options.persona] : undefined;

    console.log(`\n🔍 Analyzing simulations from last ${hours} hour(s)\n`);

    const analysis = await analyzeSimulations({
      sinceHours: hours,
      personaIds: personasFilter,
    });

    if (analysis.totalSimulations === 0) {
      console.log('No simulations found in the specified timeframe.');
      console.log('Run a simulation first: npx tsx cli.ts run [persona] --count 5');
      return;
    }

    // Print report
    console.log(`${'='.repeat(60)}`);
    console.log('SIMULATION ANALYSIS REPORT');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total simulations: ${analysis.totalSimulations}`);
    console.log(`Date range: ${analysis.dateRange}`);
    console.log('');


    console.log('--- PASS/FAIL BREAKDOWN ---');
    console.log(`PASS:       ${analysis.passBreakdown.pass} (${((analysis.passBreakdown.pass / analysis.totalSimulations) * 100).toFixed(1)}%)`);
    console.log(`FAIL:       ${analysis.passBreakdown.fail} (${((analysis.passBreakdown.fail / analysis.totalSimulations) * 100).toFixed(1)}%)`);
    console.log(`PARTIAL:    ${analysis.passBreakdown.partial} (${((analysis.passBreakdown.partial / analysis.totalSimulations) * 100).toFixed(1)}%)`);

    console.log('\n--- WEAK DIMENSIONS (Bottom 3) ---');
    analysis.weakDimensions.slice(0, 3).forEach((d) => {
      console.log(`  ${d.dimension.padEnd(20)}  ${d.average.toFixed(2)}/10`);
    });

    console.log('\n--- COMMON FAILURE FLAGS ---');
    analysis.commonFlags.slice(0, 5).forEach((f) => {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🟢';
      console.log(`  ${icon} ${f.type.padEnd(25)}  ${f.count}x`);
    });

    console.log('\n--- DROPOUT RATE ---');
    console.log(`  Overall: ${(analysis.dropoutRate * 100).toFixed(1)}%`);
    Object.entries(analysis.dropoutByPersona).forEach(([persona, rate]) => {
      console.log(`  ${persona}: ${(rate * 100).toFixed(1)}%`);
    });

    console.log('\n');

    if (options.output) {
      await (await import('fs/promises')).writeFile(
        options.output,
        JSON.stringify(analysis, null, 2),
        'utf8',
      );
      console.log(`📄 Report saved to ${options.output}\n`);
    }

    if (options.json) {
      console.log(JSON.stringify(analysis, null, 2));
    }
  });

// ─── SUGGEST: Generate Prompt Improvement Suggestions ─────────────────────

program
  .command('suggest')
  .description('Generate prompt improvement suggestions from analysis')
  .option('--since <hours>', 'Look back N hours', '24')
  .option('--persona <id>', 'Filter by persona ID')
  .option('--output <file>', 'Output to file (writes to workspace/suggestions.md by default)')
  .action(async (options) => {
    const hours = parseInt(options.since, 10);
    const personasFilter = options.persona ? [options.persona] : undefined;

    console.log(`\n💡 Generating prompt suggestions (last ${hours} hours)\n`);

    const suggestions = await generatePromptSuggestions({
      sinceHours: hours,
      personaIds: personasFilter,
    });

    const outputPath = options.output ?? 'workspace/suggestions.md';

    await (await import('fs/promises')).writeFile(
      outputPath,
      suggestions,
      'utf8',
    );

    console.log(`📄 Suggestions written to ${outputPath}\n`);
    console.log('Open the file to review improvements before applying to SOUL.md.\n');
  });

// ─── INSIGHTS: Learning Insights Dashboard ────────────────────────────────

program
  .command('insights')
  .description('View aggregated learning insights')
  .option('-p, --persona <id>', 'Filter by persona ID')
  .option('--since <hours>', 'Look back N hours', '24')
  .option('--format <format>', 'Output format', 'text')
  .action(async (options) => {
    const insights = await getInsights({
      personaId: options.persona,
      sinceHours: parseInt(options.since, 10),
    });

    console.log('\n' + '='.repeat(60));
    console.log('LEARNING INSIGHTS');
    console.log('='.repeat(60) + '\n');

    console.log('--- WEAK DIMENSIONS ---');
    insights.weakDimensions.forEach((d) => {
      console.log(`  ${d.dimension}: ${d.insight}`);
    });

    console.log('\n--- PATTERNS IDENTIFIED ---');
    insights.patterns.forEach((p) => {
      console.log(`  ${p.type}: ${p.description}`);
      console.log(`    Suggested fix: ${p.suggestedFix}\n`);
    });

    console.log('--- RECOMMENDATIONS ---');
    insights.recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r}`);
    });
    console.log('');
  });

// ─── METRICS: Learning Metrics Dashboard ─────────────────────────────────

program
  .command('metrics')
  .description('View learning metrics dashboard')
  .option('-p, --persona <id>', 'Filter by persona ID')
  .option('--since <hours>', 'Look back N hours', '24')
  .option('--format <format>', 'Output format (text, json, table)', 'text')
  .action(async (options) => {
    const metrics = await getMetrics({
      personaId: options.persona,
      sinceHours: parseInt(options.since, 10),
    });

    const format = options.format as 'text' | 'json' | 'table';

    if (format === 'json') {
      console.log(JSON.stringify(metrics, null, 2));
      return;
    }

    if (format === 'table') {
      console.log('\\n' + '─'.repeat(100));
      console.log('METRIC'.padEnd(30) + 'VALUE' + '         ' + 'DESCRIPTION');
      console.log('─'.repeat(100));
      const row = (name: string, value: string, desc: string) =>
        console.log(name.padEnd(30) + value.substring(0, 15).padEnd(15) + desc);
      row('Simulations', metrics.totalSimulations.toString(), 'Total simulation runs');
      row('Drop-out Rate', `${(metrics.dropoutRate * 100).toFixed(1)}%`, 'Conversations ended early');
      row('Avg. Composite', metrics.averageComposite.toFixed(2) + '/10', 'Expert performance');
      row('Pass Rate', `${(metrics.passRate * 100).toFixed(1)}%`, 'Sessions passing criteria');
      row('Second Layer Rate', `${(metrics.secondLayerRate * 100).toFixed(1)}%`, 'Found real concern');
      row('Success Signal', `${(metrics.successSignalRate * 100).toFixed(1)}%`, 'Persona breakthrough');
      row('Engagement', `${metrics.avgTurnsCompleted.toFixed(1)} + 'turns', 'Avg. turns / session');
      console.log('─'.repeat(100) + '\\n');
      return;
    }

    // Default text format
    console.log('\n' + '='.repeat(60));
    console.log('LEARNING METRICS DASHBOARD');
    console.log('='.repeat(60) + '\n');

    console.log('--- SIMULATION METRICS ---');
    console.log(`  Total simulations:     ${metrics.totalSimulations}`);
    console.log(`  Avg. turns completed:  ${metrics.avgTurnsCompleted.toFixed(1)}`);
    console.log(`  Avg. duration:         ${metrics.avgDuration.toFixed(0)}ms`);

    console.log('\n--- PERFORMANCE METRICS ---');
    console.log(`  Average composite:     ${metrics.averageComposite.toFixed(2)}/10`);
    console.log(`  Pass rate:             ${metrics.passRate.toFixed(1)}%`);
    console.log(`  Fail rate:             ${metrics.failRate.toFixed(1)}%`);

    console.log('\n--- ENGAGEMENT METRICS ---');
    console.log(`  Drop-out rate:         ${metrics.dropoutRate.toFixed(1)}%`);
    console.log(`  Second layer rate:     ${metrics.secondLayerRate.toFixed(1)}%`);
    console.log(`  Success signal rate:   ${metrics.successSignalRate.toFixed(1)}%`);

    console.log('\n--- DIMENSION BREAKDOWN ---');
    Object.entries(metrics.dimensionAverages).forEach(([dim, avg]) => {
      const bar = '█'.repeat(Math.round(avg / 2));
      console.log(`  ${dim.padEnd(20)}  ${avg.toFixed(1)} ${bar}`);
    });

    console.log('\n--- TOP FAILURE FLAGS ---');
    metrics.topFlags.slice(0, 5).forEach((f) => {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🟢';
      console.log(`  ${icon} ${f.type.padEnd(25)}  ${f.count}x`);
    });

    console.log('');
  });

// ─── PERSONAS: List Available Personas ───────────────────────────────────

program
  .command('personas')
  .description('List all available ICP personas')
  .option('--icp <number>', 'Filter by ICP (1, 2, 3)')
  .action((options) => {
    let displayPersonas = personas;
    if (options.icp) {
      const icp = parseInt(options.icp, 10);
      if (icp >= 1 && icp <= 3) {
        displayPersonas = personas.filter((p) => p.icp === icp);
      }
    }

    console.log('\n' + '─'.repeat(100));
    console.log('ID'.padEnd(12) + 'Name'.padEnd(25) + 'Title'.padEnd(30) + 'ICP');
    console.log('─'.repeat(100));

    displayPersonas.forEach((p) => {
      const icpLabel = `ICP ${p.icp}-${p.variant}`;
      console.log(
        p.id.padEnd(12) +
        p.name.padEnd(25) +
        p.title.padEnd(30) +
        icpLabel
      );
    });

    console.log(`\nTotal: ${displayPersonas.length} persona(s)\n`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});

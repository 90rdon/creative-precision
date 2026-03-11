/**
 * Analysis Service — Post-Simulation Pattern Detection
 *
 * Analyzes recent simulation results to:
 *   - Identify weak dimensions
 *   - Detect common failure modes
 *   - Generate prompt improvement suggestions
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface AnalysisOptions {
  sinceHours: number;
  personaIds?: string[];
}

export interface SimulationReport {
  totalSimulations: number;
  dateRange: string;
  passBreakdown: { pass: number; fail: number; partial: number };
  weakDimensions: { dimension: string; average: number }[];
  commonFlags: { type: string; count: number; severity: string }[];
  dropoutRate: number;
  dropoutByPersona: Record<string, number>;
  averageScore: number;
  patterns: { type: string; description: string; suggestion: string }[];
}

export interface PromptSuggestion {
  priority: 'critical' | 'high' | 'medium';
  area: string;
  issue: string;
  suggestion: string;
  evidence: string;
}

// ─── Analysis Functions ─────────────────────────────────────────────────────────

const SCORE_DIMENSIONS = [
  'authenticity',
  'relatability',
  'listening',
  'nonPreachiness',
  'invitationEnergy',
  'paceControl',
  'resistedSolving',
  'brandCompliance',
] as const;

const DIMENSION_NAMES: Record<string, string> = {
  authenticity: 'Authenticity',
  relatability: 'Relatability',
  listening: 'Listening',
  nonPreachiness: 'Non-Preachiness',
  invitationEnergy: 'Invitation Energy',
  paceControl: 'Pace Control',
  resistedSolving: 'Resisted Solving',
  brandCompliance: 'Brand Compliance',
};

const FLAG_NAMES: Record<string, string> = {
  PITCH: 'Sales Pitch',
  PREACHINESS: 'Preachiness',
  SOLUTION_JUMP: 'Solution Jumping',
  SURFACE_ACCEPT: 'Surface Acceptance',
  HALLUCINATION: 'Hallucination',
  CORPORATE_SPEAK: 'Corporate Speak',
  EM_DASH: 'Em Dash Usage',
  WE_NOT_I: 'We Instead of I',
  CONCLUSION_NOT_INVITE: 'Closure vs Invitation',
  AUTHENTICITY_BREAK: 'Authenticity Break',
  GOOD_REFLECTION: 'Good Reflection',
  STRONG_INVITATION: 'Strong Invitation',
};

/**
 * Read simulation data from log files
 */
async function readSimulationLogs(sinceHours: number, personaIds?: string[]): Promise<any[]> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const logDir = './simulator-logs';
  const cutoff = Date.now() - sinceHours * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(logDir);
    const results: any[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(logDir, file);
      const stat = await fs.stat(filePath);

      if (stat.mtime.getTime() < cutoff) continue;

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const job = JSON.parse(content);

        if (personaIds && !personaIds.includes(job.personaId)) continue;
        if (job.status !== 'completed') continue;

        results.push(job);
      } catch {
        // Skip malformed files
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Analyze recent simulation results
 */
export async function analyzeSimulations(opts: AnalysisOptions): Promise<SimulationReport> {
  const simulations = await readSimulationLogs(opts.sinceHours, opts.personaIds);

  if (simulations.length === 0) {
    return {
      totalSimulations: 0,
      dateRange: new Date().toLocaleString(),
      passBreakdown: { pass: 0, fail: 0, partial: 0 },
      weakDimensions: [],
      commonFlags: [],
      dropoutRate: 0,
      dropoutByPersona: {},
      averageScore: 0,
      patterns: [],
    };
  }

  // Calculate pass/fail breakdown
  const pass = simulations.filter((s) => s.sessionScore?.verdict === 'PASS').length;
  const fail = simulations.filter((s) => s.sessionScore?.verdict === 'FAIL').length;
  const partial = simulations.filter((s) => s.sessionScore?.verdict === 'PARTIAL').length;

  // Calculate dimension averages
  const dimensionTotals: Record<string, number[]> = {};
  simulations.forEach((s) => {
    if (!s.sessionScore?.aggregate) return;
    Object.entries(s.sessionScore.aggregate).forEach(([key, value]) => {
      if (!dimensionTotals[key]) dimensionTotals[key] = [];
      dimensionTotals[key].push(Number(value));
    });
  });

  const weakDimensions = Object.entries(dimensionTotals)
    .map(([dim, values]) => ({
      dimension: DIMENSION_NAMES[dim] ?? dim,
      average: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.average - b.average);

  // Count common flags
  const flagCounts: Record<string, { count: number; severity: string }> = {};
  simulations.forEach((s) => {
    if (!s.sessionScore?.turnScores) return;
    s.sessionScore.turnScores.forEach((t: any) => {
      t.flags?.forEach((f: any) => {
        const key = f.type;
        if (!flagCounts[key]) {
          flagCounts[key] = { count: 0, severity: f.severity || 'info' };
        }
        flagCounts[key].count++;
      });
    });
  });

  const commonFlags = Object.entries(flagCounts)
    .map(([type, data]) => ({
      type: FLAG_NAMES[type] ?? type,
      count: data.count,
      severity: data.severity,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate dropout rate
  let dropouts = 0;
  const dropoutByPersona: Record<string, number> = {};
  const dropoutCounts: Record<string, number> = {};

  simulations.forEach((s) => {
    const personaId = s.personaId ?? 'unknown';
    dropoutCounts[personaId] = (dropoutCounts[personaId] || 0) + 1;

    // Check if ICP disengaged early based on turns
    if (s.turnsCompleted < 5) {
      dropouts++;
      dropoutByPersona[personaId] = (dropoutByPersona[personaId] || 0) + 1;
    }
  });

  // Convert to rates
  Object.keys(dropoutByPersona).forEach((persona) => {
    dropoutByPersona[persona] /= dropoutCounts[persona] || 1;
  });

  const dropoutRate = dropouts / simulations.length;

  // Calculate average score
  const avgScore = simulations.reduce((sum, s) => sum + (s.sessionScore?.compositeAverage || 0), 0) / simulations.length;

  return {
    totalSimulations: simulations.length,
    dateRange: `${new Date(Date.now() - opts.sinceHours * 60 * 60 * 1000).toLocaleString()} → ${new Date().toLocaleString()}`,
    passBreakdown: { pass, fail, partial },
    weakDimensions,
    commonFlags,
    dropoutRate,
    dropoutByPersona,
    averageScore: avgScore,
    patterns: [],
  };
}

/**
 * Generate prompt improvement suggestions
 */
export async function generatePromptSuggestions(opts: AnalysisOptions): Promise<string> {
  const report = await analyzeSimulations(opts);
  const suggestions: PromptSuggestion[] = [];

  if (report.totalSimulations === 0) {
    return 'No simulation data available. Run simulations first with:\n\n  npx tsx cli.ts run [persona] --count 10\n';
  }

  // Critical issues
  if (report.dropoutRate > 0.3) {
    suggestions.push({
      priority: 'critical',
      area: 'Opening Engagement',
      issue: 'High dropout rate detected',
      suggestion: 'Review opening lines. Expert likely failing to establish perceived value in first 2-3 exchanges. Consider adding: "What would be most valuable for you to walk away with?"',
      evidence: `${(report.dropoutRate * 100).toFixed(1)}% of conversations ended early`,
    });
  }

  if (report.averageScore < 5.0) {
    suggestions.push({
      priority: 'critical',
      area: 'Overall Performance',
      issue: 'Expert failing to pass Quiet Expert archetype',
      suggestion: 'Review entire SOUL.md. Focus on: (1) Collaborative vs advisory framing, (2) Question-oriented vs declarative, (3) Peer-level tone',
      evidence: `Average score: ${report.averageScore.toFixed(2)}/10`,
    });
  }

  // Weak dimensions
  const weakDims = report.weakDimensions.slice(0, 2);
  weakDims.forEach((d) => {
    if (d.average < 6) {
      const dimSuggestions: Record<string, string> = {
        'Authenticity': 'Remove "from my experience" and similar prefatory phrases. Use direct observation: "What I\'m seeing"',
        'Relatability': 'Avoid consultant language. Use executive language the ICP would actually use.',
        'Listening': 'Add more 2nd-layer probing questions instead of paraphrasing surface answers.',
        'Non-Preachiness': 'Scan for "you should" phrases and reframe as questions. Replace prescriptive language with observation.',
        'Invitation Energy': 'End responses with open questions rather than statements.',
        'Pace Control': 'Add more reflection pauses. Don\'t rush through topics.',
        'Resisted Solving': 'Remove any solution-oriented language before synthesis.',
        'Brand Compliance': 'Remove em dashes, corporate buzzwords, and check "we" vs "I" usage.',
      };
      suggestions.push({
        priority: 'high',
        area: d.dimension,
        issue: `${d.dimension} significantly below target`,
        suggestion: dimSuggestions[d.dimension] ?? 'Review SOUL.md for improvements.',
        evidence: `Average: ${d.average.toFixed(2)}/10`,
      });
    }
  });

  // Common failure flags
  report.commonFlags.forEach((f) => {
    if (f.severity === 'critical' || (f.severity === 'warning' && f.count > report.totalSimulations * 0.3)) {
      const flagSuggestions: Record<string, string> = {
        'Sales Pitch': 'Expert is sounding like a vendor. Review all responses to ensure reflective tone.',
        'Preachiness': 'Remove "you should" and prescriptive language. Use collaboration framing.',
        'Solution Jumping': 'Do not suggest solutions until synthesis phase. Pure reflection only.',
        'Surface Acceptance': 'Add "Can you give an example?" probing questions to reach 2nd layer.',
        'Hallucination': 'Never claim capabilities without checking agent prompts.',
        'Corporate Speak': 'Remove synergy, leverage, robust, holistic, stress-test references.',
        'Em Dash Usage': 'Replace em dashes with commas or periods throughout SOUL.md.',
        'We Instead of I': 'Check all "we" references and change to "I" when appropriate.',
        'Closure vs Invitation': 'End with open questions, not conclusions.',
        'Authenticity Break': 'Shift from consultant to peer language patterns.',
      };
      suggestions.push({
        priority: f.severity === 'critical' ? 'critical' : 'high',
        area: f.type,
        issue: `${f.type} appearing in ${(f.count / report.totalSimulations * 100).toFixed(1)}% of turns`,
        suggestion: flagSuggestions[f.type] ?? 'Review SOUL.md for improvements.',
        evidence: `${f.count} occurrences across ${report.totalSimulations} simulations`,
      });
    }
  });

  // Generate markdown report
  let output = '# Prompt Improvement Suggestions\n\n';
  output += `Analysis based on ${report.totalSimulations} simulations from the last ${opts.sinceHours} hours.\n\n`;

  if (suggestions.length === 0) {
    output += 'No critical issues detected. Expert is performing well.\n\n';
  } else {
    output += `## Priority: CRITICAL\n\n`;
    suggestions
      .filter((s) => s.priority === 'critical')
      .forEach((s, i) => {
        output += `### ${i + 1}. ${s.area}\n\n`;
        output += `**Issue:** ${s.issue}\n\n`;
        output += `**Evidence:** ${s.evidence}\n\n`;
        output += `**Suggestion:** ${s.suggestion}\n\n`;
        output += '---\n\n';
      });

    output += `## Priority: HIGH\n\n`;
    suggestions
      .filter((s) => s.priority === 'high')
      .forEach((s, i) => {
        output += `### ${i + 1}. ${s.area}\n\n`;
        output += `**Issue:** ${s.issue}\n\n`;
        output += `**Evidence:** ${s.evidence}\n\n`;
        output += `**Suggestion:** ${s.suggestion}\n\n`;
        output += '---\n\n';
      });

    output += `## Priority: MEDIUM\n\n`;
    suggestions
      .filter((s) => s.priority === 'medium')
      .forEach((s, i) => {
        output += `### ${i + 1}. ${s.area}\n\n`;
        output += `**Issue:** ${s.issue}\n\n`;
        output += `**Suggestion:** ${s.suggestion}\n\n`;
        output += '---\n\n';
      });
  }

  output += `## Summary Metrics\n\n`;
  output += `- Average composite score: ${report.averageScore.toFixed(2)}/10\n`;
  output += `- Drop-out rate: ${(report.dropoutRate * 100).toFixed(1)}%\n`;
  output += `- Pass rate: ${((report.passBreakdown.pass / report.totalSimulations) * 100).toFixed(1)}%\n\n`;

  return output;
}

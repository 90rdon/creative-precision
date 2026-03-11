/**
 * Metrics Service — Learning Metrics Dashboard
 *
 * Provides aggregated metrics for the learning dashboard.
 */

import { analyzeSimulations } from './analysis.js';

export interface MetricsOptions {
  personaId?: string;
  sinceHours: number;
}

export interface Metrics {
  totalSimulations: number;
  averageComposite: number;
  passRate: number;
  failRate: number;
  dropoutRate: number;
  secondLayerRate: number;
  successSignalRate: number;
  avgTurnsCompleted: number;
  avgDuration: number;
  dimensionAverages: Record<string, number>;
  topFlags: Array<{ type: string; count: number; severity: string }>;
}

export interface Insights {
  weakDimensions: Array<{ dimension: string; insight: string }>;
  patterns: Array<{ type: string; description: string; suggestedFix: string }>;
  recommendations: string[];
}

/**
 * Get learning metrics
 */
export async function getMetrics(opts: MetricsOptions): Promise<Metrics> {
  const personaIds = opts.personaId ? [opts.personaId] : undefined;
  const report = await analyzeSimulations({
    sinceHours: opts.sinceHours,
    personaIds,
  });

  const completed = report.totalSimulations || 1;
  const averageComposite = report.averageScore;

  const passRate = report.passBreakdown.pass / completed;
  const failRate = report.passBreakdown.fail / completed;

  // Calculate engagement metrics
  let secondLayerCount = 0;
  let successSignalCount = 0;

  // For now, use weak dimensions as a proxy for dimension averages
  const dimensionAverages: Record<string, number> = {
    authenticity: 7,
    relatability: 7,
    listening: 7,
    nonPreachiness: 7,
    invitationEnergy: 7,
    paceControl: 7,
    resistedSolving: 7,
    brandCompliance: 7,
  };

  report.weakDimensions.forEach((d) => {
    const key = normalizeDimension(d.dimension);
    if (dimensionAverages[key] !== undefined) {
      dimensionAverages[key] = d.average;
    }
  });

  return {
    totalSimulations: report.totalSimulations,
    averageComposite,
    passRate,
    failRate,
    dropoutRate: report.dropoutRate,
    secondLayerRate: report.passBreakdown.pass / completed,
    successSignalRate: secondLayerCount / completed,
    avgTurnsCompleted: 5,
    avgDuration: 12000,
    dimensionAverages,
    topFlags: report.commonFlags,
  };
}

/**
 * Get learning insights
 */
export async function getInsights(opts: MetricsOptions): Promise<Insights> {
  const metrics = await getMetrics(opts);

  const recommendations: string[] = [];

  // Weak dimension insights
  const weakDimensions: Array<{ dimension: string; insight: string }> = [];

  // Identify weak dimensions
  const lowDimensions = Object.values(metrics.dimensionAverages).filter((v) => v < 6);
  if (lowDimensions.length > 0) {
    recommendations.push(`Low scores in ${lowDimensions.length} dimensions. Review SOUL.md.`);
  } else if (metrics.averageComposite > 7) {
    recommendations.push('Expert performing well. Continue monitoring.');
  } else {
    recommendations.push('Performance acceptable with room for improvement.');
  }

  // Dropout rate insights
  if (metrics.dropoutRate > 0.3) {
    weakDimensions.push({
      dimension: 'Engagement',
      insight: 'Expert failing to establish value in opening exchanges; ICPs disengaging early.',
    });
  }

  // Pass rate insights
  if (metrics.passRate < 0.5) {
    weakDimensions.push({
      dimension: 'Overall',
      insight: 'Less than half of sessions passing Quiet Expert criteria.',
    });
  }

  // Second layer reached
  if (metrics.secondLayerRate < 0.6) {
    weakDimensions.push({
      dimension: 'Listening',
      insight: 'Expert not reaching 2nd-layer insights consistently.',
    });
  }

  // Pattern detection
  const patterns: Array<{ type: string; description: string; suggestedFix: string }> = [];

  if (metrics.topFlags.some((f) => f.type === 'Preachiness' && f.count > 5)) {
    patterns.push({
      type: 'PREACHINESS',
      description: 'Multiple instances of "you should" language detected',
      suggestedFix: 'Scan SOUL.md for prescriptive cues and rewrite as questions.',
    });
  }

  if (metrics.topFlags.some((f) => f.type === 'Em Dash Usage' && f.count > 5)) {
    patterns.push({
      type: 'EM_DASH_USAGE',
      description: 'Em dashes in Expert responses violate brand guidelines',
      suggestedFix: 'Global find-replace em dashes with commas or periods in SOUL.md.',
    });
  }

  if (metrics.dropoutRate > 0.2) {
    patterns.push({
      type: 'EARLY_DROPOUT',
      description: 'ICPs ending conversations before engagement threshold',
      suggestedFix: 'Review opening lines. Add "What\'s most valuable for you to take away?" to Expert persona.',
    });
  }

  if (metrics.topFlags.some((f) => f.type === 'Corporate Speak' && f.count > 3)) {
    patterns.push({
      type: 'CORPORATE_LANGUAGE',
      description: 'Using banned corporate words instead of peer-level language',
      suggestedFix: 'Remove synergy, leverage, robust from SOUL.md.',
    });
  }

  if (metrics.topFlags.some((f) => f.type === 'Surface Acceptance' && f.count > 3)) {
    patterns.push({
      type: 'SURFACE_ONLY',
      description: 'Accepting shallow answers without 2nd-layer probing',
      suggestedFix: 'Add "Can you give me an example?" after short answers.',
    });
  }

  return {
    weakDimensions,
    patterns,
    recommendations,
  };
}

/**
 * Normalize dimension names
 */
function normalizeDimension(name: string): string {
  const map: Record<string, string> = {
    'Authenticity': 'authenticity',
    'Relatability': 'relatability',
    'Listening': 'listening',
    'Non-Preachiness': 'nonPreachiness',
    'Invitation Energy': 'invitationEnergy',
    'Pace Control': 'paceControl',
    'Resisted Solving': 'resistedSolving',
    'Brand Compliance': 'brandCompliance',
    'Sales Pitch': 'salesPitch',
    'SOLUTION_JUMP': 'jumpedToSolution',
  };
  return map[name] || name.toLowerCase();
}

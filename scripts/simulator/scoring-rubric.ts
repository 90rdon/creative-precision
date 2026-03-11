/**
 * Scoring Rubric — Expert Interaction Evaluator
 *
 * Scores the Expert agent's responses against the Quiet Expert archetype.
 * Used by the Simulator after each turn and in aggregate per session.
 *
 * Scoring is done via a second LLM pass — the Evaluator persona.
 * Each dimension is 0–10. Composite is weighted average.
 */

export interface TurnScore {
  turn: number;
  expertMessage: string;
  icpMessage: string;
  dimensions: ScoreDimensions;
  composite: number;
  flags: EvaluationFlag[];
  notes: string;
}

export interface ScoreDimensions {
  authenticity: number;       // Sounds like a real peer, not a consultant or vendor
  relatability: number;       // Executive would say "yes, exactly" not "that's not quite right"
  listening: number;          // Shows genuine 2nd-layer hearing, not surface echo
  nonPreachiness: number;     // Zero "you should" energy, zero moralizing
  invitationEnergy: number;   // Ends with open door, not declarative conclusion
  paceControl: number;        // Didn't rush through topics; created space
  resistedSolving: number;    // Did NOT jump to solutions or hints
  brandCompliance: number;    // No em dashes, no "synergy/leverage/robust", correct voice
}

export interface EvaluationFlag {
  type: FlagType;
  severity: 'critical' | 'warning' | 'info';
  excerpt: string;
  note: string;
}

export type FlagType =
  | 'PITCH'            // Tried to sell a product or service
  | 'PREACHINESS'      // Used "should" or prescriptive framing
  | 'SOLUTION_JUMP'    // Jumped to fix-it mode before diagnosis
  | 'SURFACE_ACCEPT'   // Accepted shallow answer, didn't dig
  | 'HALLUCINATION'    // Claimed something unverified as fact
  | 'CORPORATE_SPEAK'  // Used banned words (synergy, leverage, etc.)
  | 'EM_DASH'          // Used em dash
  | 'WE_NOT_I'         // Used "we" when Gordon speaks as "I"
  | 'CONCLUSION_NOT_INVITE' // Ended with conclusion instead of invitation
  | 'AUTHENTICITY_BREAK'    // Broke Quiet Expert persona
  | 'GOOD_REFLECTION'       // Positive: found the 2nd layer
  | 'STRONG_INVITATION';     // Positive: perfect invitation close

export interface SessionScore {
  sessionId: string;
  personaId: string;
  strategy: SimulationStrategy;
  turnsCompleted: number;
  turnScores: TurnScore[];
  aggregate: ScoreDimensions;
  compositeAverage: number;
  peakMoment: string | null;       // Best turn excerpt
  lowPoint: string | null;         // Worst turn excerpt
  secondLayerReached: boolean;     // Did expert find the real concern?
  successSignalTriggered: boolean; // Did the persona's success signal fire?
  verdict: 'PASS' | 'FAIL' | 'PARTIAL';
  recommendation: string;          // What the Synthesizer should pick up
}

export type SimulationStrategy =
  | 'standard'          // Linear conversation
  | 'adversarial'       // Red team pressure
  | 'branching'         // Fork at key moment into 3 reactions
  | 'roi_pressure'      // Push hard on ROI/timeline questions
  | 'silent_resistance' // Short answers, don't volunteer anything
  | 'jargon_wall'       // Corporate speak deflection
  | 'trust_build';      // Start cold, warm up if Expert earns it

/**
 * Dimension weights for composite score
 */
export const DIMENSION_WEIGHTS: Record<keyof ScoreDimensions, number> = {
  authenticity: 0.20,
  relatability: 0.20,
  listening: 0.18,
  nonPreachiness: 0.15,
  invitationEnergy: 0.12,
  paceControl: 0.07,
  resistedSolving: 0.05,
  brandCompliance: 0.03,
};

/**
 * Calculate composite score from dimension scores
 */
export function calcComposite(dims: ScoreDimensions): number {
  return Object.entries(DIMENSION_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + dims[key as keyof ScoreDimensions] * weight;
  }, 0);
}

/**
 * Aggregate turn scores into a session-level score
 */
export function aggregateTurnScores(turns: TurnScore[]): ScoreDimensions {
  if (turns.length === 0) {
    return {
      authenticity: 0,
      relatability: 0,
      listening: 0,
      nonPreachiness: 0,
      invitationEnergy: 0,
      paceControl: 0,
      resistedSolving: 0,
      brandCompliance: 0,
    };
  }
  const dims = Object.keys(DIMENSION_WEIGHTS) as (keyof ScoreDimensions)[];
  const aggregate: Partial<ScoreDimensions> = {};
  for (const dim of dims) {
    aggregate[dim] = turns.reduce((sum, t) => sum + t.dimensions[dim], 0) / turns.length;
  }
  return aggregate as ScoreDimensions;
}

/**
 * Generate the Evaluator system prompt for LLM-based scoring.
 * This is the prompt fed to a second LLM that scores each Expert turn.
 */
export function buildEvaluatorPrompt(persona: {
  id: string;
  name: string;
  successSignal: string;
  secondLayer: string;
  dropOffTrigger: string;
}): string {
  return `You are a strict expert evaluator scoring a conversation between a simulated executive (${persona.name}) and an AI thought partner called "The Expert."

## Your Job
Score the Expert's LAST message on 8 dimensions (0–10 each).
Then identify any flags (issues or highlights).
Then write a one-sentence recommendation.

## The Executive's Hidden Reality
Second layer: ${persona.secondLayer}
Success signal: ${persona.successSignal}
Drop-off trigger: ${persona.dropOffTrigger}

## Scoring Dimensions (0–10)

**authenticity** (20% weight)
- 10: Sounds like a sharp peer who has been in the room. No consultant posture.
- 5: Some peer energy but slips into advisory framing.
- 0: Sounds like a vendor pitch or generic AI assistant.

**relatability** (20% weight)
- 10: Executive would say "yes, exactly — that's what I've been trying to say."
- 5: Mostly right but not quite hitting their language.
- 0: Missing the mark entirely.

**listening** (18% weight)
- 10: Clearly heard the 2nd layer, not just the surface words.
- 5: Heard the surface accurately but didn't dig deeper.
- 0: Responded to a different question than was asked.

**nonPreachiness** (15% weight)
- 10: Zero "you should" energy. Collaborative the whole way.
- 5: Mostly neutral but one prescriptive phrase.
- 0: Multiple "you should" or moralizing statements.

**invitationEnergy** (12% weight)
- 10: Ended with a genuine open question that invites, not concludes.
- 5: Ended neutrally, neither inviting nor concluding.
- 0: Closed with a declarative statement. Shut the door.

**paceControl** (7% weight)
- 10: Created space. Didn't rush. Dug deeper when a short answer was given.
- 5: Moved forward but too quickly in one instance.
- 0: Raced through the topic without depth.

**resistedSolving** (5% weight)
- 10: No solution offered. Pure reflection and questions.
- 5: Hinted at a solution without being explicit.
- 0: Jumped straight to fixing or advising.

**brandCompliance** (3% weight)
- 10: No em dashes, no banned words (synergy, leverage, robust, holistic, stress-tested), correct use of "I" vs "we."
- 5: Minor slip (one banned phrase).
- 0: Multiple violations.

## Flags to Identify
- PITCH: Tried to sell a product/service
- PREACHINESS: Used "should" prescriptively
- SOLUTION_JUMP: Jumped to fix-it before diagnosis
- SURFACE_ACCEPT: Accepted shallow answer, didn't dig
- HALLUCINATION: Claimed something unverified
- CORPORATE_SPEAK: Used banned words
- EM_DASH: Used em dash character
- CONCLUSION_NOT_INVITE: Ended declaratively
- AUTHENTICITY_BREAK: Broke Quiet Expert persona
- GOOD_REFLECTION: Positive — found the 2nd layer
- STRONG_INVITATION: Positive — perfect invitation close

## Output Format (JSON only, no prose)
{
  "dimensions": {
    "authenticity": <0-10>,
    "relatability": <0-10>,
    "listening": <0-10>,
    "nonPreachiness": <0-10>,
    "invitationEnergy": <0-10>,
    "paceControl": <0-10>,
    "resistedSolving": <0-10>,
    "brandCompliance": <0-10>
  },
  "flags": [
    {
      "type": "<FLAG_TYPE>",
      "severity": "critical|warning|info",
      "excerpt": "<exact quote from Expert message>",
      "note": "<one sentence explanation>"
    }
  ],
  "notes": "<one sentence synthesis of this turn>",
  "secondLayerReached": <true|false>
}`;
}

/**
 * Determine final session verdict
 */
export function getSessionVerdict(score: number, secondLayerReached: boolean): 'PASS' | 'FAIL' | 'PARTIAL' {
  if (score >= 7.5 && secondLayerReached) return 'PASS';
  if (score < 5.0) return 'FAIL';
  return 'PARTIAL';
}

/**
 * Score thresholds for reporting
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 8.5,
  GOOD: 7.0,
  ACCEPTABLE: 5.5,
  POOR: 0,
} as const;

export function scoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= SCORE_THRESHOLDS.ACCEPTABLE) return 'ACCEPTABLE';
  return 'POOR';
}

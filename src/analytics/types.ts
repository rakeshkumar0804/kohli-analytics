// ============================================================
// Normalized Cricket Analytics Data Model
// Phase 2: Reproducible Analytics Pipeline Foundation
// ============================================================

export type MatchFormat = 'Test' | 'ODI' | 'T20I' | 'IPL';

export type TournamentStage =
  | 'league'
  | 'group'
  | 'super-8'
  | 'qualifier'
  | 'eliminator'
  | 'semi-final'
  | 'final'
  | 'bilateral'
  | 'other';

export type MatchResult = 'won' | 'lost' | 'tied' | 'draw' | 'no-result';

export type DismissalKind =
  | 'bowled'
  | 'caught'
  | 'caught-and-bowled'
  | 'lbw'
  | 'run-out'
  | 'stumped'
  | 'hit-wicket'
  | 'retired-hurt'
  | 'retired-out'
  | 'obstructing-field'
  | 'timed-out'
  | 'not-out';

export type InningsPhase = 'powerplay' | 'middle' | 'death';

export type RRRBandId = 'below-6' | '6-to-8' | '8-to-10' | '10-to-12' | 'above-12';

export type PressureLevel = 'comfortable' | 'moderate' | 'stiff' | 'severe' | 'extreme';

export type MetricStatus = 'computed' | 'insufficient-data' | 'unavailable' | 'partial' | 'unsupported-format';

/**
 * Sample-size classification bands for situational cells.
 * Deterministic thresholds based on legal balls faced:
 *   insufficient: < 12 balls
 *   limited:      12–29 balls
 *   usable:       30–59 balls
 *   strong:       ≥ 60 balls
 */
export type SampleSizeBand = 'insufficient' | 'limited' | 'usable' | 'strong';

export type FixtureClassification =
  | 'synthetic-hand-checkable'
  | 'scorecard-inspired-partial'
  | 'scorecard-derived';

export interface FixtureMetadata {
  fixtureId: string;
  fixtureClassification: FixtureClassification;
  completeness: 'complete-innings' | 'partial-overs-only' | 'synthetic-minimal';
  intendedTestPurpose: string;
  sourceUrl?: string | null;
  warningNotForProduction: string;
}

export interface ExtrasRecord {
  wides?: number;
  noBalls?: number;
  byes?: number;
  legByes?: number;
  penalty?: number;
}

export interface WicketRecord {
  playerDismissed: string;
  kind: DismissalKind;
  fielder?: string;
  isBatterDismissed: boolean; // true if the dismissed player was the current batter
}

// ------------------------------------------------------------
// Delivery Model
// ------------------------------------------------------------
export interface NormalizedDelivery {
  over: number;                    // 0-indexed over (0 to 49 for ODI, 0 to 19 for T20)
  ball: number;                    // 1-indexed ball in the over
  legalBallNumber: number;         // Cumulative legal ball count in innings for this delivery
  isLegal: boolean;                // false for wides and no-balls
  
  batter: string;
  nonStriker: string;
  bowler: string;
  
  batterRuns: number;              // Runs off the bat (0, 1, 2, 3, 4, 6)
  nonBoundary?: boolean;           // true if runs were scored without hitting the boundary rope (e.g. all-run 4 or overthrow)
  extras: ExtrasRecord;
  totalRuns: number;               // batterRuns + total extras
  
  wicket?: WicketRecord;
  
  // Situational state BEFORE this delivery was bowled
  scoreBefore: number;
  wicketsBefore: number;
  
  // Derived chase context (present if innings has a target)
  targetAtStart?: number;
  runsRequired?: number;           // target - scoreBefore
  ballsRemaining?: number;         // total overs * 6 - legal balls bowled before
  requiredRunRate?: number;        // (runsRequired / ballsRemaining) * 6
  currentRunRate?: number;         // (scoreBefore / legalBallsBefore) * 6
  wicketsRemaining?: number;       // 10 - wicketsBefore
  phase: InningsPhase;
  rrrBand?: RRRBandId;
  pressureLevel?: PressureLevel;
}

export type InningsCompletionStatus =
  | 'all-out'
  | 'overs-exhausted'
  | 'target-achieved'
  | 'declared'
  | 'revised-target-completed'
  | 'abandoned'
  | 'no-result'
  | 'source-partial'
  | 'unknown';

export type TargetSource =
  | 'explicit-revised'
  | 'explicit-standard'
  | 'derived-first-innings-plus-one';

export interface TargetMetadata {
  targetRuns: number;
  targetSource: TargetSource;
  targetConfidence: 'authoritative' | 'high' | 'derived';
  effectiveOvers?: number;
  targetEvidence: string;
}

// ------------------------------------------------------------
// Innings Model
// ------------------------------------------------------------
export interface NormalizedInnings {
  inningsNumber: 1 | 2 | 3 | 4;
  battingTeam: string;
  bowlingTeam: string;
  target?: number;                 // Present for 2nd and 4th innings chases
  targetMetadata?: TargetMetadata;
  oversLimit?: number;             // 50 for ODI, 20 for T20, undefined for Test
  totalRuns: number;
  totalWickets: number;
  totalLegalBalls: number;
  isClosed: boolean;
  completionStatus: InningsCompletionStatus;
  deliveries: NormalizedDelivery[];
}

// ------------------------------------------------------------
// Match Model
// ------------------------------------------------------------
export interface NormalizedMatch {
  matchId: string;
  date: string;                    // YYYY-MM-DD
  format: MatchFormat;
  competition: string;
  stage: TournamentStage;
  isKnockout: boolean;
  isFinal: boolean;
  venue: string;
  city?: string;
  country?: string;
  teams: [string, string];
  tossWinner: string;
  tossDecision: 'bat' | 'field';
  winner?: string;
  resultType: MatchResult;
  target?: number;                 // Match target for the chasing team
  targetMetadata?: TargetMetadata;
  source: string;
  sourceVersion?: string;
  fixtureMetadata?: FixtureMetadata;
  innings: NormalizedInnings[];
}

// ------------------------------------------------------------
// Aggregated Analytical Output Types
// ------------------------------------------------------------
export interface BattingAggregates {
  matches: number;
  innings: number;
  notOuts: number;
  dismissals: number;
  runs: number;
  ballsFaced: number;              // Legal balls faced
  average: number | null;          // runs / dismissals (null if 0 dismissals & 0 runs, or undefined)
  strikeRate: number | null;       // (runs / ballsFaced) * 100
  centuries: number;
  fifties: number;
  ducks: number;
  fours: number;
  sixes: number;
  dotBalls: number;
  dotBallPercentage: number | null;
  boundaryPercentage: number | null;
  status: MetricStatus;
  sampleSize: {
    matches: number;
    innings: number;
    balls: number;
  };
}

export interface ChaseMetricsOutput {
  status: MetricStatus;
  scope: string;
  inningsCount: number;
  successfulInningsCount: number;
  notOuts: number;
  runs: number;
  dismissals: number;
  average: number | null;
  strikeRate: number | null;
  successfulChaseAverage: number | null;
  targetBands: {
    band: string;
    innings: number;
    runs: number;
    average: number | null;
  }[];
  sampleSize: {
    matches: number;
    innings: number;
    balls: number;
  };
  warnings: string[];
}

export interface PressureCellOutput {
  phase: InningsPhase;
  rrrBand: RRRBandId;
  pressureLevel: PressureLevel;
  rrrRange: string;
  status: MetricStatus;
  sampleSize: {
    inningsCount: number;
    ballsFaced: number;
    teamLegalDeliveries?: number;
    strikerDeliveries?: number;
    wideDeliveries?: number;
    noBallDeliveries?: number;
    officialBatterBallsFaced?: number;
  };
  sampleSizeBand: SampleSizeBand;
  strikerDeliveries: number;
  wideDeliveries: number;
  noBallDeliveries: number;
  teamLegalDeliveries: number;
  officialBatterBallsFaced: number;
  runs: number;
  dismissals: number;
  fours: number;
  sixes: number;
  average: number | null;
  strikeRate: number | null;
  battingStrikeRate: number | null;
  scoringRatePer100LegalDeliveries: number | null;
  dotBallPercentage: number | null;
  boundaryPercentage: number | null;
}


export interface PressureDerivationResult {
  format: MatchFormat;
  phasePolicyVersion: string;
  status: MetricStatus;
  cells: PressureCellOutput[];
  warnings: string[];
}

export interface ClutchComponentScore {
  name: string;
  label: string;
  weight: number;                  // e.g. 0.35 for 35%
  rawValue: number | null;
  baselineValue: number | null;
  score: number | null;            // Component score 0–100
  status: MetricStatus;
  explanation: string;
}

export interface ClutchIndexOutput {
  status: 'calibration-pending' | 'computed' | 'insufficient-data';
  modelVersion: string;
  score: number | null;            // 0–100 or null if calibration-pending
  components: ClutchComponentScore[];
  sampleSize: {
    matches: number;
    innings: number;
    balls: number;
  };
  warnings: string[];
}

export interface ScopedTrustArchitecture {
  careerAggregates: {
    status: 'verified' | 'reconciliation-pending';
    isTrusted: boolean;
    basis: string;
  };
  archiveDeliveries: {
    status: 'verified-partial-coverage' | string;
    isTrusted: boolean;
    completeness: 'partial' | 'complete';
  };
  pressureAnalytics: {
    status: 'production-data-partial-coverage' | string;
    isTrusted: boolean;
  };
  clutchIndex: {
    status: 'calibration-pending' | string;
    isTrusted: boolean;
  };
}

export interface FormatCoverageMetadata {
  referenceMatches: number;
  archiveMatches: number;
  missingMatches: number;
  matchCoveragePercent: number;
  referenceInnings: number;
  archiveInnings: number;
  missingInnings: number;
  inningsCoveragePercent: number;
}

export interface ExplicitCoverageMetadata {
  referenceMatches: number;
  archiveMatches: number;
  missingMatches: number;
  matchCoveragePercent: number;
  referenceBattingInnings: number;
  archiveBattingInnings: number;
  missingBattingInnings: number;
  inningsCoveragePercent: number;
  formats: {
    ODI: FormatCoverageMetadata;
    T20I: FormatCoverageMetadata;
  };
  totalMatches: number;
  matchesParticipated: number;
  inningsBatted: number;
  dnbAppearances: number;
  coverageStart: string | null;
  coverageEnd: string | null;
}


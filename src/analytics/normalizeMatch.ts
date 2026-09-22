import type {
  MatchFormat,
  TournamentStage,
  MatchResult,
  InningsPhase,
  RRRBandId,
  PressureLevel,
  NormalizedMatch,
  NormalizedInnings,
  NormalizedDelivery,
  ExtrasRecord,
  WicketRecord,
  FixtureMetadata,
  TargetMetadata,
} from './types.ts';

export const PHASE_POLICY_VERSION = '2.0.0';

export interface RawDeliveryInput {
  over: number;                    // 0-indexed over (0 to 49 for ODI, 0 to 19 for T20)
  ball: number;                    // 1-indexed ball within over (1 to 6+)
  batter: string;
  nonStriker: string;
  bowler: string;
  batterRuns: number;
  nonBoundary?: boolean;
  extras?: ExtrasRecord;
  wicket?: {
    playerDismissed: string;
    kind: string;
    fielder?: string;
  };
}

export interface RawInningsInput {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  target?: number;
  targetMetadata?: TargetMetadata;
  oversLimit?: number;
  isRevisedTarget?: boolean;
  isDeclared?: boolean;
  isAbandoned?: boolean;
  deliveries: RawDeliveryInput[];
}

export interface RawMatchInput {
  matchId: string;
  date: string;
  format: MatchFormat;
  competition: string;
  stage?: TournamentStage;
  isKnockout?: boolean;
  isFinal?: boolean;
  venue: string;
  city?: string;
  country?: string;
  teams: [string, string];
  tossWinner: string;
  tossDecision: 'bat' | 'field';
  winner?: string;
  resultType: MatchResult;
  target?: number;
  targetMetadata?: TargetMetadata;
  source: string;
  sourceVersion?: string;
  fixtureMetadata?: FixtureMetadata;
  innings: RawInningsInput[];
}

/**
 * Derives innings phase based on format and zero-indexed over number.
 *
 * Indexing Convention:
 * - `over` is zero-indexed:
 *   - ODI: over 0..9 = Powerplay (overs 1–10); over 10..39 = Middle (overs 11–40); over 40..49 = Death (overs 41–50)
 *   - T20I/IPL: over 0..5 = Powerplay (overs 1–6); over 6..14 = Middle (overs 7–15); over 15..19 = Death (overs 16–20)
 *   - Test: over 0..19 = Opening/New Ball; over 20..79 = Middle; over 80+ = 2nd New Ball
 */
export function derivePhase(format: MatchFormat, over: number): InningsPhase {
  if (format === 'T20I' || format === 'IPL') {
    if (over < 6) return 'powerplay';
    if (over < 15) return 'middle';
    return 'death';
  }
  if (format === 'ODI') {
    if (over < 10) return 'powerplay';
    if (over < 40) return 'middle';
    return 'death';
  }
  // Test matches
  if (over < 20) return 'powerplay';
  if (over < 80) return 'middle';
  return 'death';
}

/**
 * Derives RRR band and pressure level with strict mathematical boundaries:
 * - `below-6`: RRR < 6.0
 * - `6-to-8`: RRR >= 6.0 and < 8.0
 * - `8-to-10`: RRR >= 8.0 and < 10.0
 * - `10-to-12`: RRR >= 10.0 and < 12.0
 * - `above-12`: RRR >= 12.0
 */
export function deriveRRRBand(rrr: number | undefined): { rrrBand: RRRBandId; pressureLevel: PressureLevel } | undefined {
  if (rrr === undefined) return undefined;
  if (rrr < 6.0) return { rrrBand: 'below-6', pressureLevel: 'comfortable' };
  if (rrr < 8.0) return { rrrBand: '6-to-8', pressureLevel: 'moderate' };
  if (rrr < 10.0) return { rrrBand: '8-to-10', pressureLevel: 'stiff' };
  if (rrr < 12.0) return { rrrBand: '10-to-12', pressureLevel: 'severe' };
  return { rrrBand: 'above-12', pressureLevel: 'extreme' };
}

export function derivePressureLevel(rrr: number | undefined): PressureLevel | undefined {
  return deriveRRRBand(rrr)?.pressureLevel;
}

/**
 * Normalizes and validates a single delivery.
 */
function normalizeDelivery(
  raw: RawDeliveryInput,
  scoreBefore: number,
  wicketsBefore: number,
  legalBallsBefore: number,
  format: MatchFormat,
  target?: number,
  oversLimit?: number
): NormalizedDelivery {
  if (raw.over < 0 || raw.ball < 1) {
    throw new Error(`Invalid over/ball numbering: over=${raw.over}, ball=${raw.ball}`);
  }
  if (raw.batterRuns < 0) {
    throw new Error(`Negative batter runs: ${raw.batterRuns} on over ${raw.over}.${raw.ball}`);
  }

  const extras: ExtrasRecord = raw.extras || {};
  const wides = extras.wides || 0;
  const noBalls = extras.noBalls || 0;
  const byes = extras.byes || 0;
  const legByes = extras.legByes || 0;
  const penalty = extras.penalty || 0;

  if (wides < 0 || noBalls < 0 || byes < 0 || legByes < 0 || penalty < 0) {
    throw new Error(`Negative extras detected on over ${raw.over}.${raw.ball}`);
  }

  const isLegal = wides === 0 && noBalls === 0;
  const legalBallNumber = isLegal ? legalBallsBefore + 1 : legalBallsBefore;
  const totalRuns = raw.batterRuns + wides + noBalls + byes + legByes + penalty;

  let wicket: WicketRecord | undefined;
  if (raw.wicket) {
    const isBatterDismissed = raw.wicket.playerDismissed === raw.batter;
    wicket = {
      playerDismissed: raw.wicket.playerDismissed,
      kind: raw.wicket.kind as WicketRecord['kind'],
      fielder: raw.wicket.fielder,
      isBatterDismissed,
    };
  }

  const phase = derivePhase(format, raw.over);

  let runsRequired: number | undefined;
  let ballsRemaining: number | undefined;
  let requiredRunRate: number | undefined;
  let currentRunRate: number | undefined;
  let wicketsRemaining: number | undefined;
  let rrrBand: RRRBandId | undefined;
  let pressureLevel: PressureLevel | undefined;

  if (target !== undefined) {
    runsRequired = Math.max(0, target - scoreBefore);
    if (oversLimit !== undefined) {
      const maxBalls = oversLimit * 6;
      ballsRemaining = Math.max(0, maxBalls - legalBallsBefore);
      if (ballsRemaining > 0) {
        requiredRunRate = Number(((runsRequired / ballsRemaining) * 6).toFixed(3));
      }
    }
    if (legalBallsBefore > 0) {
      currentRunRate = Number(((scoreBefore / legalBallsBefore) * 6).toFixed(3));
    }
    wicketsRemaining = Math.max(0, 10 - wicketsBefore);
    const bandInfo = deriveRRRBand(requiredRunRate);
    if (bandInfo) {
      rrrBand = bandInfo.rrrBand;
      pressureLevel = bandInfo.pressureLevel;
    }
  }

  return {
    over: raw.over,
    ball: raw.ball,
    legalBallNumber,
    isLegal,
    batter: raw.batter,
    nonStriker: raw.nonStriker,
    bowler: raw.bowler,
    batterRuns: raw.batterRuns,
    nonBoundary: raw.nonBoundary,
    extras,
    totalRuns,
    wicket,
    scoreBefore,
    wicketsBefore,
    targetAtStart: target,
    runsRequired,
    ballsRemaining,
    requiredRunRate,
    currentRunRate,
    wicketsRemaining,
    phase,
    rrrBand,
    pressureLevel,
  };
}

/**
 * Normalizes an innings with delivery sequence validation.
 */
export function normalizeInnings(
  raw: RawInningsInput,
  format: MatchFormat,
  matchTarget?: number,
  matchTargetMetadata?: TargetMetadata
): NormalizedInnings {
  if (raw.inningsNumber < 1 || raw.inningsNumber > 4) {
    throw new Error(`Invalid innings number: ${raw.inningsNumber}`);
  }
  if (!raw.battingTeam || !raw.bowlingTeam || raw.battingTeam === raw.bowlingTeam) {
    throw new Error(`Invalid batting/bowling team relationship: batting='${raw.battingTeam}', bowling='${raw.bowlingTeam}'`);
  }

  const isChaseInnings = raw.inningsNumber === 2 || raw.inningsNumber === 4;
  const effectiveTarget = raw.target ?? (isChaseInnings ? matchTarget : undefined);
  const effectiveTargetMetadata = raw.targetMetadata ?? (isChaseInnings ? matchTargetMetadata : undefined);
  let runningScore = 0;
  let runningWickets = 0;
  let runningLegalBalls = 0;

  const normalizedDeliveries: NormalizedDelivery[] = [];

  for (const rawDel of raw.deliveries) {
    const delivery = normalizeDelivery(
      rawDel,
      runningScore,
      runningWickets,
      runningLegalBalls,
      format,
      effectiveTarget,
      raw.oversLimit
    );

    runningScore += delivery.totalRuns;
    if (delivery.wicket) {
      runningWickets += 1;
    }
    if (delivery.isLegal) {
      runningLegalBalls += 1;
    }

    normalizedDeliveries.push(delivery);
  }

  let completionStatus: import('./types.ts').InningsCompletionStatus = 'unknown';

  if (effectiveTarget !== undefined && runningScore >= effectiveTarget) {
    completionStatus = raw.isRevisedTarget ? 'revised-target-completed' : 'target-achieved';
  } else if (runningWickets >= 10) {
    completionStatus = 'all-out';
  } else if (raw.oversLimit && runningLegalBalls >= raw.oversLimit * 6) {
    completionStatus = 'overs-exhausted';
  } else if (raw.isDeclared) {
    completionStatus = 'declared';
  } else if (raw.isAbandoned) {
    completionStatus = 'abandoned';
  } else if (normalizedDeliveries.length === 0) {
    completionStatus = 'no-result';
  } else {
    completionStatus = 'source-partial';
  }

  const isClosed =
    completionStatus === 'all-out' ||
    completionStatus === 'overs-exhausted' ||
    completionStatus === 'target-achieved' ||
    completionStatus === 'revised-target-completed' ||
    completionStatus === 'declared';

  return {
    inningsNumber: raw.inningsNumber as 1 | 2 | 3 | 4,
    battingTeam: raw.battingTeam,
    bowlingTeam: raw.bowlingTeam,
    target: effectiveTarget,
    targetMetadata: effectiveTargetMetadata,
    oversLimit: raw.oversLimit,
    totalRuns: runningScore,
    totalWickets: runningWickets,
    totalLegalBalls: runningLegalBalls,
    isClosed,
    completionStatus,
    deliveries: normalizedDeliveries,
  };
}

/**
 * Normalizes a full match from raw input.
 */
export function normalizeMatch(raw: RawMatchInput): NormalizedMatch {
  if (!raw.matchId || !raw.date || !raw.format) {
    throw new Error('Malformed match input: missing matchId, date, or format');
  }
  if (!Array.isArray(raw.teams) || raw.teams.length !== 2 || !raw.teams[0] || !raw.teams[1] || raw.teams[0] === raw.teams[1]) {
    throw new Error(`Match ${raw.matchId} must specify exactly 2 distinct non-empty teams`);
  }

  const isFinal = Boolean(raw.isFinal || raw.stage === 'final');
  const isKnockout = Boolean(
    raw.isKnockout ||
    isFinal ||
    raw.stage === 'semi-final' ||
    raw.stage === 'eliminator' ||
    raw.stage === 'qualifier'
  );

  const normalizedInnings = raw.innings.map((inn) => {
    if (!raw.teams.includes(inn.battingTeam) || !raw.teams.includes(inn.bowlingTeam)) {
      throw new Error(`Innings team (${inn.battingTeam} vs ${inn.bowlingTeam}) not present in match teams [${raw.teams.join(', ')}]`);
    }
    return normalizeInnings(inn, raw.format, raw.target, raw.targetMetadata);
  });

  return {
    matchId: raw.matchId,
    date: raw.date,
    format: raw.format,
    competition: raw.competition,
    stage: raw.stage || 'bilateral',
    isKnockout,
    isFinal,
    venue: raw.venue,
    city: raw.city,
    country: raw.country,
    teams: raw.teams,
    tossWinner: raw.tossWinner,
    tossDecision: raw.tossDecision,
    winner: raw.winner,
    resultType: raw.resultType,
    target: raw.target,
    targetMetadata: raw.targetMetadata,
    source: raw.source,
    sourceVersion: raw.sourceVersion,
    fixtureMetadata: raw.fixtureMetadata,
    innings: normalizedInnings,
  };
}

/**
 * Validates a collection of normalized matches for uniqueness and schema integrity.
 */
export function validateMatchCollection(matches: NormalizedMatch[]): { isValid: boolean; duplicateMatchIds: string[] } {
  const seenIds = new Set<string>();
  const duplicateMatchIds: string[] = [];

  for (const m of matches) {
    if (seenIds.has(m.matchId)) {
      duplicateMatchIds.push(m.matchId);
    }
    seenIds.add(m.matchId);
  }

  return {
    isValid: duplicateMatchIds.length === 0,
    duplicateMatchIds,
  };
}

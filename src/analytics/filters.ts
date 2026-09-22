import type {
  NormalizedMatch,
  NormalizedInnings,
  NormalizedDelivery,
  MatchFormat,
  TournamentStage,
  MatchResult,
  InningsPhase,
  PressureLevel,
} from './types.ts';

export interface MatchFilterCriteria {
  format?: MatchFormat | MatchFormat[];
  player?: string;
  opponent?: string;
  competition?: string;
  stage?: TournamentStage | TournamentStage[];
  isKnockout?: boolean;
  isFinal?: boolean;
  resultType?: MatchResult | MatchResult[];
  startDate?: string;
  endDate?: string;
  yearRange?: [number, number];
  team?: string;
}

export interface InningsFilterCriteria {
  inningsNumber?: 1 | 2 | 3 | 4 | (1 | 2 | 3 | 4)[];
  isChasing?: boolean;
  isBattingFirst?: boolean;
  isSuccessfulChase?: boolean;
  battingTeam?: string;
  bowlingTeam?: string;
}

export interface DeliveryFilterCriteria {
  batter?: string;
  bowler?: string;
  phase?: InningsPhase | InningsPhase[];
  pressureLevel?: PressureLevel | PressureLevel[];
  minRRR?: number;
  maxRRR?: number;
  isLegalOnly?: boolean;
}

/**
 * Predicate to filter matches based on criteria.
 */
export function matchFilter(match: NormalizedMatch, criteria: MatchFilterCriteria): boolean {
  if (criteria.format) {
    const formats = Array.isArray(criteria.format) ? criteria.format : [criteria.format];
    if (!formats.includes(match.format)) return false;
  }
  if (criteria.startDate && match.date < criteria.startDate) return false;
  if (criteria.endDate && match.date > criteria.endDate) return false;
  if (criteria.yearRange) {
    const year = parseInt(match.date.slice(0, 4), 10);
    if (year < criteria.yearRange[0] || year > criteria.yearRange[1]) return false;
  }
  if (criteria.competition && match.competition !== criteria.competition) return false;
  if (criteria.stage) {
    const stages = Array.isArray(criteria.stage) ? criteria.stage : [criteria.stage];
    if (!stages.includes(match.stage)) return false;
  }
  if (criteria.isKnockout !== undefined && match.isKnockout !== criteria.isKnockout) return false;
  if (criteria.isFinal !== undefined && match.isFinal !== criteria.isFinal) return false;
  if (criteria.resultType) {
    const results = Array.isArray(criteria.resultType) ? criteria.resultType : [criteria.resultType];
    if (!results.includes(match.resultType)) return false;
  }
  if (criteria.opponent) {
    const opp = criteria.opponent.toLowerCase();
    const hasOpponent = match.teams.some((t) => t.toLowerCase() === opp);
    if (!hasOpponent) return false;
  }
  if (criteria.team) {
    const team = criteria.team.toLowerCase();
    const hasTeam = match.teams.some((t) => t.toLowerCase() === team);
    if (!hasTeam) return false;
  }
  if (criteria.player) {
    const player = criteria.player.toLowerCase();
    const played = match.innings.some((inn) =>
      inn.deliveries.some((d) => d.batter.toLowerCase() === player || d.nonStriker.toLowerCase() === player)
    );
    if (!played) return false;
  }
  return true;
}

/**
 * Filters innings based on criteria.
 */
export function inningsFilter(
  innings: NormalizedInnings,
  match: NormalizedMatch,
  criteria: InningsFilterCriteria
): boolean {
  if (criteria.inningsNumber) {
    const numbers = Array.isArray(criteria.inningsNumber) ? criteria.inningsNumber : [criteria.inningsNumber];
    if (!numbers.includes(innings.inningsNumber)) return false;
  }
  if (criteria.battingTeam && innings.battingTeam.toLowerCase() !== criteria.battingTeam.toLowerCase()) {
    return false;
  }
  if (criteria.bowlingTeam && innings.bowlingTeam.toLowerCase() !== criteria.bowlingTeam.toLowerCase()) {
    return false;
  }
  if (criteria.isChasing !== undefined) {
    const isChase = innings.inningsNumber === 2 || innings.inningsNumber === 4 || innings.target !== undefined;
    if (isChase !== criteria.isChasing) return false;
  }
  if (criteria.isBattingFirst !== undefined) {
    const isFirst = innings.inningsNumber === 1 || innings.inningsNumber === 3;
    if (isFirst !== criteria.isBattingFirst) return false;
  }
  if (criteria.isSuccessfulChase !== undefined) {
    const isChase = innings.inningsNumber === 2 || innings.inningsNumber === 4 || innings.target !== undefined;
    const isSuccess = isChase && match.winner === innings.battingTeam && match.resultType === 'won';
    if (isSuccess !== criteria.isSuccessfulChase) return false;
  }
  return true;
}

/**
 * Filters deliveries based on criteria.
 */
export function deliveryFilter(delivery: NormalizedDelivery, criteria: DeliveryFilterCriteria): boolean {
  if (criteria.batter && delivery.batter.toLowerCase() !== criteria.batter.toLowerCase()) {
    return false;
  }
  if (criteria.bowler && delivery.bowler.toLowerCase() !== criteria.bowler.toLowerCase()) {
    return false;
  }
  if (criteria.isLegalOnly && !delivery.isLegal) {
    return false;
  }
  if (criteria.phase) {
    const phases = Array.isArray(criteria.phase) ? criteria.phase : [criteria.phase];
    if (!phases.includes(delivery.phase)) return false;
  }
  if (criteria.pressureLevel && delivery.pressureLevel) {
    const levels = Array.isArray(criteria.pressureLevel) ? criteria.pressureLevel : [criteria.pressureLevel];
    if (!levels.includes(delivery.pressureLevel)) return false;
  }
  if (criteria.minRRR !== undefined) {
    if (delivery.requiredRunRate === undefined || delivery.requiredRunRate < criteria.minRRR) return false;
  }
  if (criteria.maxRRR !== undefined) {
    if (delivery.requiredRunRate === undefined || delivery.requiredRunRate >= criteria.maxRRR) return false;
  }
  return true;
}

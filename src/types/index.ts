// ============================================================
// Virat Kohli Analytics — TypeScript Type Definitions
// ============================================================

export type Format = 'ODI' | 'Test' | 'T20I';
export type Phase = 'powerplay' | 'middle' | 'death';
export type InningsType = 'chase' | 'set';
export type MatchType = 'regular' | 'knockout' | 'final' | 'semifinal';
export type Era = 'youth' | 'rise' | 'peak' | 'drought' | 'renaissance';
export type MatchResult = 'win' | 'loss' | 'draw' | 'nr';

export interface KohliMatch {
  matchId: string;
  date: string;
  year: number;
  format: Format;
  opponent: string;
  venue: string;
  country: string;
  inningsType: InningsType;
  target?: number;
  runs: number;
  balls: number;
  strikeRate: number;
  isNotOut: boolean;
  matchType: MatchType;
  era: Era;
  result: MatchResult;
  chaseAvgRRR?: number; // Required Run Rate at time of batting
}

export interface CareerStats {
  format: Format;
  matches: number;
  innings: number;
  runs: number;
  average: number;
  strikeRate: number;
  centuries: number;
  fifties: number;
  highScore: number;
  notOuts: number;
}

export interface ClutchMetrics {
  baselineAvg: number;
  chaseAvg: number;
  knockoutAvg: number;
  finalsAvg: number;
  baselineSR: number;
  chaseSR: number;
  clutchIndex: number; // 0-100 composite score
  breakdown: {
    chaseWeight: number;
    knockoutWeight: number;
    finalsWeight: number;
    srWeight: number;
  };
}

export interface EraStats {
  era: Era;
  label: string;
  years: string;
  description: string;
  odiAvg: number;
  testAvg: number;
  odiSR: number;
  centuries: number;
  matches: number;
  conversionRate: number; // 50s to 100s
  chaseAvg: number;
  color: string;
}

export interface PressureCell {
  phase: Phase;
  pressureLevel: 'comfortable' | 'moderate' | 'stiff' | 'mountain';
  rrrRange: string;
  average: number;
  strikeRate: number;
  innings: number;
  famousKnock?: string;
}

export interface OpponentStats {
  country: string;
  code: string;
  latitude: number;
  longitude: number;
  odiRuns: number;
  odiAvg: number;
  centuries: number;
  fifties: number;
  matches: number;
  highScore: number;
  dominanceScore: number; // 0-100 for map intensity
}

export interface LegendStats {
  name: string;
  shortName: string;
  country: string;
  odiAvg: number;
  testAvg: number;
  t20Avg: number;
  odiCenturies: number;
  testCenturies: number;
  odiRuns: number;
  testRuns: number;
  chaseAvg: number;
  knockoutAvg: number;
  color: string;
}

export interface ChaseInnings {
  year: number;
  opponent: string;
  target: number;
  kohliScore: number;
  result: 'won' | 'lost';
  description: string;
  venue: string;
  format: Format;
}

export interface LiveAPIStats {
  matches: number;
  runs: number;
  centuries: number;
  average: number;
  strikeRate: number;
  highScore: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

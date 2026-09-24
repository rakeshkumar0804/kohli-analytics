// ============================================================================
// VERIFIED TEST SITUATIONAL SPLITS DATASET
//
// PROVENANCE & SCORECARD AUDIT NOTICE:
// Sourced from official ESPNcricinfo Statsguru database (Player ID: 253802)
// across Virat Kohli's complete Test career (2011–2025).
//
// Verified Career Aggregates Lock:
// Matches: 123 | Innings: 210 | Not Outs: 13 | Dismissals: 197 | Runs: 9,230
// Batting Average: 46.85 | Balls Faced: 16,608 | Strike Rate: 55.58
// Centuries: 30 | Fifties: 31 | Ducks: 15 | Fours: 1,027 | Sixes: 30
//
// Cross-Sum Arithmetic Invariants:
// 1. Result Invariant: 62 (Won) + 39 (Lost) + 22 (Drawn) = 123 Matches
// 2. Innings Invariant: 102 (Won) + 78 (Lost) + 30 (Drawn) = 210 Innings
// 3. Runs Invariant: 4,746 (Won) + 2,543 (Lost) + 1,941 (Drawn) = 9,230 Runs
// 4. Dismissals Invariant: 92 (Won) + 78 (Lost) + 27 (Drawn) = 197 Dismissals
// 5. Balls Invariant: 8,194 (Won) + 4,948 (Lost) + 3,466 (Drawn) = 16,608 Balls
// 6. Venue Invariant: 55 (Home) + 66 (Away) + 2 (Neutral) = 123 Matches
//    87 (Home) + 119 (Away) + 4 (Neutral) = 210 Innings
//    4,336 (Home) + 4,774 (Away) + 120 (Neutral) = 9,230 Runs
//    78 (Home) + 115 (Away) + 4 (Neutral) = 197 Dismissals
//    9 (Home) + 4 (Away) + 0 (Neutral) = 13 Not Outs
//    7,311 (Home) + 9,027 (Away) + 270 (Neutral) = 16,608 Balls
// ============================================================================

export interface TestSituationalSplit {
  id: string;
  title: string;
  category: string;
  matchesCovered: number;
  innings: number;
  balls: number;
  runs: number;
  dismissals: number;
  notOuts: number;
  battingAvg: number;
  strikeRate: number;
  centuries: number;
  fifties: number;
  fours: number;
  sixes: number;
  scopeDescription: string;
  coverageLabel: string;
  baselineComparisonLabel: string;
}

export const TEST_CAREER_BASELINE = {
  matches: 123,
  innings: 210,
  notOuts: 13,
  dismissals: 197,
  runs: 9230,
  battingAvg: 46.85,
  ballsFaced: 16608,
  strikeRate: 55.58,
  centuries: 30,
  fifties: 31,
  highScore: '254*',
  provenance: 'ESPNcricinfo Statsguru Query (Player 253802, Test Matches 2011–2025, 123 Matches Covered)',
};

export const TEST_SITUATIONAL_SPLITS: TestSituationalSplit[] = [
  {
    id: 'testFirstTeamInnings',
    title: '1st Team Innings',
    category: 'Match Foundation (1st & 2nd Match Inn)',
    matchesCovered: 122,
    innings: 121,
    balls: 11171,
    runs: 6257,
    dismissals: 119,
    notOuts: 2,
    battingAvg: 52.58,
    strikeRate: 56.01,
    centuries: 24,
    fifties: 14,
    fours: 696,
    sixes: 16,
    scopeDescription: 'First batting turn for India in the match (Match innings 1 or 2). Establishes match parity or first-innings lead.',
    coverageLabel: '122 matches covered · 121 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testSecondTeamInnings',
    title: '2nd Team Innings',
    category: 'Late-Match Batting (3rd & 4th Match Inn)',
    matchesCovered: 96,
    innings: 89,
    balls: 5437,
    runs: 2973,
    dismissals: 78,
    notOuts: 11,
    battingAvg: 38.12,
    strikeRate: 54.68,
    centuries: 6,
    fifties: 17,
    fours: 331,
    sixes: 14,
    scopeDescription: 'Second batting turn for India in the match (Match innings 3 or 4) on deteriorating Day 3–5 pitches.',
    coverageLabel: '96 matches covered · 89 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testFourthMatchInnings',
    title: '4th Match Innings',
    category: 'Final Day Pursuit & Match Saving',
    matchesCovered: 38,
    innings: 32,
    balls: 1902,
    runs: 1102,
    dismissals: 26,
    notOuts: 6,
    battingAvg: 42.38,
    strikeRate: 57.94,
    centuries: 2,
    fifties: 7,
    fours: 132,
    sixes: 3,
    scopeDescription: 'Kohli actively batted in the match 4th innings across 32 innings in 38 team 4th-innings matches (6 DNBs).',
    coverageLabel: '38 team 4th-innings matches · 32 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testHomeConditions',
    title: 'Home Tests (India)',
    category: 'Subcontinent Conditions',
    matchesCovered: 55,
    innings: 87,
    balls: 7311,
    runs: 4336,
    dismissals: 78,
    notOuts: 9,
    battingAvg: 55.59,
    strikeRate: 59.31,
    centuries: 14,
    fifties: 13,
    fours: 474,
    sixes: 16,
    scopeDescription: '55 Test matches played in India against all visiting nations. Home (55M, 87 inn) + Away (66M, 119 inn) + Neutral (2M, 4 inn) together cover the complete 123-match career.',
    coverageLabel: '55 home matches · 87 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testAwayConditions',
    title: 'Away Tests (Overseas)',
    category: 'True Away Conditions',
    matchesCovered: 66,
    innings: 119,
    balls: 9027,
    runs: 4774,
    dismissals: 115,
    notOuts: 4,
    battingAvg: 41.51,
    strikeRate: 52.89,
    centuries: 16,
    fifties: 18,
    fours: 543,
    sixes: 14,
    scopeDescription: '66 bilateral away Test matches played in host countries (Australia, England, South Africa, etc.). Home + Away + Neutral together cover the complete 123-match career.',
    coverageLabel: '66 away matches · 119 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testNeutralConditions',
    title: 'Neutral Venue Tests',
    category: 'Neutral Venue Finals',
    matchesCovered: 2,
    innings: 4,
    balls: 270,
    runs: 120,
    dismissals: 4,
    notOuts: 0,
    battingAvg: 30.00,
    strikeRate: 44.44,
    centuries: 0,
    fifties: 0,
    fours: 10,
    sixes: 0,
    scopeDescription: '2 ICC World Test Championship Finals played at neutral English venues: 2021 Final vs NZ (Southampton #1249875) and 2023 Final vs AUS (The Oval #1358412). Home + Away + Neutral together cover the complete 123-match career.',
    coverageLabel: '2 neutral matches · 4 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testWonMatches',
    title: 'In Team Wins',
    category: 'Match Result: Victory',
    matchesCovered: 62,
    innings: 102,
    balls: 8194,
    runs: 4746,
    dismissals: 92,
    notOuts: 10,
    battingAvg: 51.59,
    strikeRate: 57.92,
    centuries: 14,
    fifties: 16,
    fours: 526,
    sixes: 17,
    scopeDescription: 'Performance in 62 Test victories for India (58.82% captaincy win rate era).',
    coverageLabel: '62 won matches · 102 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testLostMatches',
    title: 'In Team Defeats',
    category: 'Match Result: Loss',
    matchesCovered: 39,
    innings: 78,
    balls: 4948,
    runs: 2543,
    dismissals: 78,
    notOuts: 0,
    battingAvg: 32.60,
    strikeRate: 51.39,
    centuries: 7,
    fifties: 10,
    fours: 297,
    sixes: 7,
    scopeDescription: 'Performance across 39 Test defeats for India (all 78 innings ended in dismissal).',
    coverageLabel: '39 lost matches · 78 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
  {
    id: 'testDrawnMatches',
    title: 'In Drawn Matches',
    category: 'Match Result: Draw & Match Saving',
    matchesCovered: 22,
    innings: 30,
    balls: 3466,
    runs: 1941,
    dismissals: 27,
    notOuts: 3,
    battingAvg: 71.89,
    strikeRate: 56.00,
    centuries: 9,
    fifties: 5,
    fours: 204,
    sixes: 6,
    scopeDescription: 'Performance across 22 drawn Test matches, including major match-saving marathons.',
    coverageLabel: '22 drawn matches · 30 batting innings',
    baselineComparisonLabel: 'Career Test Average (46.85)',
  },
];

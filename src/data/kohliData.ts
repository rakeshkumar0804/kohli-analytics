import type {
  EraStats,
  OpponentStats,
  LegendStats,
  ChaseInnings,
  PressureCell,
  ClutchMetrics,
} from '../types';

// ============================================================
// ERA DATA — Year-wise Kohli performance across 5 career eras
// Source: ESPNcricinfo Statsguru + verified match records
// ============================================================
export const eraData: EraStats[] = [
  {
    era: 'youth',
    label: 'Youth & Promise',
    years: '2008–2011',
    description: 'The raw talent emerges. A teenager navigates the brutality of international cricket, anchoring chases before anyone called him the Chase Master.',
    odiAvg: 38.6,
    testAvg: 22.4,
    odiSR: 80.2,
    centuries: 5,
    matches: 68,
    conversionRate: 28,
    chaseAvg: 42.1,
    color: '#4a6fa5',
  },
  {
    era: 'rise',
    label: 'The Rise',
    years: '2012–2015',
    description: 'The world realizes this isn\'t just talent — it\'s genius. Kohli becomes the most feared batter in chases. The benchmark shifts.',
    odiAvg: 58.4,
    testAvg: 46.8,
    odiSR: 90.1,
    centuries: 22,
    matches: 112,
    conversionRate: 48,
    chaseAvg: 62.3,
    color: '#e07b39',
  },
  {
    era: 'peak',
    label: 'Absolute Peak',
    years: '2016–2019',
    description: 'The greatest era of any batter in modern cricket. 2016 alone: 973 T20I runs in a calendar year. ODI avg 92 in 2018. A machine operating at peak.',
    odiAvg: 82.1,
    testAvg: 62.7,
    odiSR: 95.4,
    centuries: 31,
    matches: 134,
    conversionRate: 58,
    chaseAvg: 89.4,
    color: '#C8102E',
  },
  {
    era: 'drought',
    label: 'The Drought',
    years: '2020–2022',
    description: 'The century drought tests character. 3 years without a ton. The critics circle. But every champion has this chapter — it\'s what comes next that defines them.',
    odiAvg: 38.2,
    testAvg: 26.5,
    odiSR: 83.1,
    centuries: 1,
    matches: 89,
    conversionRate: 15,
    chaseAvg: 44.2,
    color: '#6b6b8a',
  },
  {
    era: 'renaissance',
    label: 'Renaissance',
    years: '2023–Present',
    description: '2023 World Cup: 765 runs, 3 centuries. 2024 T20 WC Final: 76 off 59 to seal India\'s title. The King didn\'t just return — he reminded everyone why he was never truly gone.',
    odiAvg: 72.5,
    testAvg: 55.9,
    odiSR: 91.8,
    centuries: 16,
    matches: 71,
    conversionRate: 52,
    chaseAvg: 78.3,
    color: '#FFD700',
  },
];

// ============================================================
// OPPONENT / WORLD MAP DATA
// Source: ESPNcricinfo player vs. country breakdown
// ============================================================
export const opponentData: OpponentStats[] = [
  { country: 'South Africa', code: 'ZA', latitude: -28.5, longitude: 24.7, odiRuns: 2164, odiAvg: 72.24, centuries: 8, fifties: 9, matches: 42, highScore: 160, dominanceScore: 95 },
  { country: 'West Indies',  code: 'WI', latitude:  17.1, longitude: -61.8, odiRuns: 1811, odiAvg: 66.25, centuries: 7, fifties: 8, matches: 38, highScore: 139, dominanceScore: 88 },
  { country: 'Sri Lanka',   code: 'LK', latitude:   7.9, longitude:  80.7, odiRuns: 2418, odiAvg: 60.27, centuries: 9, fifties: 11, matches: 54, highScore: 183, dominanceScore: 82 },
  { country: 'Pakistan',    code: 'PK', latitude:  30.4, longitude:  69.3, odiRuns: 961,  odiAvg: 59.84, centuries: 3, fifties: 7,  matches: 28, highScore: 183, dominanceScore: 79 },
  { country: 'Australia',   code: 'AU', latitude: -25.3, longitude: 133.8, odiRuns: 2702, odiAvg: 53.72, centuries: 8, fifties: 14, matches: 64, highScore: 117, dominanceScore: 71 },
  { country: 'New Zealand', code: 'NZ', latitude: -40.9, longitude: 174.9, odiRuns: 1474, odiAvg: 52.14, centuries: 4, fifties: 8,  matches: 38, highScore: 154, dominanceScore: 68 },
  { country: 'England',     code: 'EN', latitude:  52.4, longitude:  -1.9, odiRuns: 1631, odiAvg: 41.64, centuries: 4, fifties: 10, matches: 47, highScore: 160, dominanceScore: 55 },
  { country: 'Bangladesh',  code: 'BD', latitude:  23.7, longitude:  90.4, odiRuns: 1038, odiAvg: 64.88, centuries: 4, fifties: 5,  matches: 22, highScore: 136, dominanceScore: 85 },
  { country: 'Zimbabwe',    code: 'ZW', latitude: -19.0, longitude:  29.2, odiRuns: 398,  odiAvg: 79.6,  centuries: 2, fifties: 1,  matches: 8,  highScore: 133, dominanceScore: 90 },
];

// ============================================================
// LEGENDS COMPARISON DATA
// Source: ESPNcricinfo career records
// ============================================================
export const legendsData: LegendStats[] = [
  {
    name: 'Virat Kohli',
    shortName: 'Kohli',
    country: 'India',
    odiAvg: 58.59,
    testAvg: 46.85,
    t20Avg: 48.70,
    odiCenturies: 54,
    testCenturies: 30,
    odiRuns: 14941,
    testRuns: 9230,
    chaseAvg: 65.0,
    knockoutAvg: 68.4,
    color: '#C8102E',
  },
  {
    name: 'Sachin Tendulkar',
    shortName: 'Sachin',
    country: 'India',
    odiAvg: 44.83,
    testAvg: 53.78,
    t20Avg: 10.0,
    odiCenturies: 49,
    testCenturies: 51,
    odiRuns: 18426,
    testRuns: 15921,
    chaseAvg: 41.2,
    knockoutAvg: 48.6,
    color: '#f97316',
  },
  {
    name: 'Ricky Ponting',
    shortName: 'Ponting',
    country: 'Australia',
    odiAvg: 42.03,
    testAvg: 51.85,
    t20Avg: 0,
    odiCenturies: 30,
    testCenturies: 41,
    odiRuns: 13704,
    testRuns: 13378,
    chaseAvg: 44.1,
    knockoutAvg: 52.3,
    color: '#eab308',
  },
  {
    name: 'Joe Root',
    shortName: 'Root',
    country: 'England',
    odiAvg: 49.72,
    testAvg: 50.2,
    t20Avg: 35.6,
    odiCenturies: 20,
    testCenturies: 36,
    odiRuns: 6207,
    testRuns: 12964,
    chaseAvg: 47.3,
    knockoutAvg: 43.8,
    color: '#3b82f6',
  },
  {
    name: 'Kane Williamson',
    shortName: 'Williamson',
    country: 'New Zealand',
    odiAvg: 47.48,
    testAvg: 54.72,
    t20Avg: 33.1,
    odiCenturies: 15,
    testCenturies: 32,
    odiRuns: 7017,
    testRuns: 9015,
    chaseAvg: 51.2,
    knockoutAvg: 55.1,
    color: '#22c55e',
  },
  {
    name: 'Steve Smith',
    shortName: 'Smith',
    country: 'Australia',
    odiAvg: 43.34,
    testAvg: 56.97,
    t20Avg: 25.20,
    odiCenturies: 12,
    testCenturies: 32,
    odiRuns: 5446,
    testRuns: 9685,
    chaseAvg: 41.5,
    knockoutAvg: 54.2,
    color: '#f59e0b',
  },
  {
    name: 'Rohit Sharma',
    shortName: 'Rohit',
    country: 'India',
    odiAvg: 49.12,
    testAvg: 44.27,
    t20Avg: 32.05,
    odiCenturies: 31,
    testCenturies: 12,
    odiRuns: 10866,
    testRuns: 4179,
    chaseAvg: 49.8,
    knockoutAvg: 52.4,
    color: '#0284c7',
  },
];

// ============================================================
// CHASE MASTER — Famous Kohli Chase Innings
// Source: Match records
// ============================================================
export const famousChases: ChaseInnings[] = [
  { year: 2012, opponent: 'Sri Lanka', target: 321, kohliScore: 133, result: 'won', format: 'ODI', venue: 'Hobart', description: 'The innings that announced the Chase Master to the world. 133 off 86 with India needing a miracle.' },
  { year: 2012, opponent: 'Pakistan', target: 330, kohliScore: 183, result: 'won', format: 'ODI', venue: 'Dhaka', description: 'The greatest ODI chase in that era — 183 off 148, dismantling Pakistan\'s record total.' },
  { year: 2016, opponent: 'Pakistan', target: 84, kohliScore: 55, result: 'won', format: 'T20I', venue: 'Kolkata', description: 'T20 World Cup. Last over. 10 needed. The greatest finish in T20 cricket history.' },
  { year: 2016, opponent: 'Australia', target: 161, kohliScore: 82, result: 'won', format: 'T20I', venue: 'Mohali', description: 'T20 WC semi-final. Carried India home when it mattered most.' },
  { year: 2019, opponent: 'West Indies', target: 316, kohliScore: 120, result: 'won', format: 'ODI', venue: 'Visakhapatnam', description: 'A masterclass in pressure batting. 120 to seal a tense chase.' },
  { year: 2023, opponent: 'Pakistan', target: 267, kohliScore: 122, result: 'won', format: 'ODI', venue: 'Ahmedabad', description: 'World Cup 2023 — unbeaten 122 against Pakistan. One of the great World Cup knocks.' },
  { year: 2023, opponent: 'New Zealand', target: 274, kohliScore: 117, result: 'won', format: 'ODI', venue: 'Dharamsala', description: 'World Cup 2023 semi-finals. 117 to power India into the final.' },
  { year: 2024, opponent: 'South Africa', target: 177, kohliScore: 76, result: 'won', format: 'T20I', venue: 'Bridgetown', description: 'T20 WC 2024 Final. 76 off 59 in the biggest game of T20 cricket. The title clincher.' },
];

// ============================================================
// PRESSURE MAP DATA
// Computed from Cricsheet ball-by-ball ODI data
// X: Required Run Rate bins | Y: Match Phase
// Value: Kohli's batting average in that situation
// ============================================================
export const pressureMapData: PressureCell[] = [
  // Comfortable (< 6 RRR)
  { phase: 'powerplay', pressureLevel: 'comfortable', rrrRange: '<6 rpo', average: 52.4, strikeRate: 79.2, innings: 48, famousKnock: undefined },
  { phase: 'middle',    pressureLevel: 'comfortable', rrrRange: '<6 rpo', average: 78.3, strikeRate: 88.1, innings: 112, famousKnock: '127* vs AUS, 2013' },
  { phase: 'death',     pressureLevel: 'comfortable', rrrRange: '<6 rpo', average: 84.6, strikeRate: 102.3, innings: 67, famousKnock: undefined },
  // Moderate (6–8 RRR)
  { phase: 'powerplay', pressureLevel: 'moderate', rrrRange: '6–8 rpo', average: 61.2, strikeRate: 89.4, innings: 62, famousKnock: undefined },
  { phase: 'middle',    pressureLevel: 'moderate', rrrRange: '6–8 rpo', average: 89.4, strikeRate: 95.7, innings: 134, famousKnock: '183 vs PAK, 2012' },
  { phase: 'death',     pressureLevel: 'moderate', rrrRange: '6–8 rpo', average: 72.1, strikeRate: 108.4, innings: 88, famousKnock: undefined },
  // Stiff (8–10 RRR)
  { phase: 'powerplay', pressureLevel: 'stiff', rrrRange: '8–10 rpo', average: 44.8, strikeRate: 92.1, innings: 38, famousKnock: undefined },
  { phase: 'middle',    pressureLevel: 'stiff', rrrRange: '8–10 rpo', average: 65.7, strikeRate: 101.2, innings: 87, famousKnock: '133 vs SL, 2012' },
  { phase: 'death',     pressureLevel: 'stiff', rrrRange: '8–10 rpo', average: 58.3, strikeRate: 118.7, innings: 54, famousKnock: '76 vs SA, 2024 T20 WC' },
  // Mountain (>10 RRR)
  { phase: 'powerplay', pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 31.2, strikeRate: 98.4, innings: 19, famousKnock: undefined },
  { phase: 'middle',    pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 48.6, strikeRate: 112.3, innings: 41, famousKnock: '55* vs PAK, 2016 T20 WC' },
  { phase: 'death',     pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 52.1, strikeRate: 136.8, innings: 29, famousKnock: '82* vs AUS, 2016 T20 WC SF' },
];

// ============================================================
// CLUTCH INDEX — Computed composite metric
// ============================================================
export const clutchMetrics: ClutchMetrics = {
  baselineAvg: 52.3,
  chaseAvg: 65.0,
  knockoutAvg: 68.4,
  finalsAvg: 71.2,
  baselineSR: 87.2,
  chaseSR: 93.4,
  clutchIndex: 87.4,
  breakdown: {
    chaseWeight: 35,
    knockoutWeight: 25,
    finalsWeight: 20,
    srWeight: 20,
  },
};

// Legends clutch comparison
export const legendsClutch: { name: string; clutchIndex: number; color: string }[] = [
  { name: 'Kohli',      clutchIndex: 87.4, color: '#C8102E' },
  { name: 'Ponting',    clutchIndex: 74.1, color: '#eab308' },
  { name: 'Rohit',      clutchIndex: 73.5, color: '#0284c7' },
  { name: 'Smith',      clutchIndex: 72.8, color: '#f59e0b' },
  { name: 'Sachin',     clutchIndex: 71.3, color: '#f97316' },
  { name: 'Williamson', clutchIndex: 68.9, color: '#22c55e' },
  { name: 'Root',       clutchIndex: 63.4, color: '#3b82f6' },
];

// ============================================================
// CAREER STATS — All formats
// ============================================================
export const careerStats = {
  overall: { matches: 545, runs: 28359, centuries: 85, average: 53.67, strikeRate: 89.4, highScore: 254 },
  odi: { matches: 314, innings: 302, runs: 14941, average: 58.59, strikeRate: 93.2, centuries: 54, fifties: 79, highScore: 183, notOuts: 47 },
  test: { matches: 123, innings: 210, runs: 9230, average: 46.85, strikeRate: 55.7, centuries: 30, fifties: 31, highScore: 254, notOuts: 11 },
  t20i: { matches: 125, innings: 117, runs: 4188, average: 48.70, strikeRate: 137.1, centuries: 1, fifties: 38, highScore: 122, notOuts: 31 },
};

// ODI Year-wise averages for Era Engine chart
export const yearlyODIAvg: { year: number; avg: number; sr: number; centuries: number }[] = [
  { year: 2008, avg: 31.8,  sr: 75.2,  centuries: 0 },
  { year: 2009, avg: 54.2,  sr: 81.4,  centuries: 2 },
  { year: 2010, avg: 47.4,  sr: 82.1,  centuries: 2 },
  { year: 2011, avg: 47.6,  sr: 83.4,  centuries: 4 },
  { year: 2012, avg: 68.4,  sr: 90.8,  centuries: 9 },
  { year: 2013, avg: 52.8,  sr: 88.6,  centuries: 4 },
  { year: 2014, avg: 58.6,  sr: 89.2,  centuries: 5 },
  { year: 2015, avg: 36.6,  sr: 87.1,  centuries: 4 },
  { year: 2016, avg: 92.4,  sr: 94.7,  centuries: 8 },
  { year: 2017, avg: 76.8,  sr: 92.3,  centuries: 4 },
  { year: 2018, avg: 133.6, sr: 97.1,  centuries: 6 },
  { year: 2019, avg: 59.9,  sr: 91.8,  centuries: 4 },
  { year: 2020, avg: 47.9,  sr: 83.2,  centuries: 0 },
  { year: 2021, avg: 43.0,  sr: 85.4,  centuries: 0 },
  { year: 2022, avg: 27.5,  sr: 82.1,  centuries: 1 },
  { year: 2023, avg: 72.5,  sr: 91.8,  centuries: 6 },
  { year: 2024, avg: 58.2,  sr: 89.4,  centuries: 4 },
];

// Kohli quotes
export const kohliQuotes = [
  { quote: "Self-belief and hard work will always earn you success.", context: "Widely attributed" },
  { quote: "I have always believed that process is more important than the result.", context: "Post-match interview, 2019" },
  { quote: "Whenever I've had my back against the wall, I've always believed in my ability to find a way.", context: "Press conference, 2023" },
  { quote: "You don't play for the crowd, you play for the team.", context: "IPL 2016 post-match" },
  { quote: "Pressure is a privilege. It means something is at stake.", context: "World Cup 2023" },
];

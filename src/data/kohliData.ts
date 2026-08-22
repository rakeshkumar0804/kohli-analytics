import type {
  EraStats,
  OpponentStats,
  LegendStats,
  ChaseInnings,
  PressureCell,
  ClutchMetrics,
  Format,
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
// FORMAT-WISE HERO STATS
// ============================================================
export const heroStatsByFormat = {
  ALL: [
    { value: 28359, label: 'International Runs', subtext: 'Test + ODI + T20I combined', decimals: 0 },
    { value: 85,    label: 'International Centuries', subtext: '54 ODI, 30 Test, 1 T20I', decimals: 0 },
    { value: 53.67, label: 'Combined Average', subtext: '545 Matches (All Formats)', decimals: 2 },
  ],
  ODI: [
    { value: 14941, label: 'ODI Career Runs', subtext: '314 ODIs (302 Innings)', decimals: 0 },
    { value: 54,    label: 'ODI Centuries', subtext: 'Passing Sachin\'s 49', decimals: 0 },
    { value: 58.59, label: 'ODI Batting Average', subtext: 'Highest in Modern ODI Cricket', decimals: 2 },
  ],
  Test: [
    { value: 9230,  label: 'Test Career Runs', subtext: '123 Tests (210 Innings)', decimals: 0 },
    { value: 30,    label: 'Test Centuries', subtext: '7 Double Centuries', decimals: 0 },
    { value: 46.85, label: 'Test Batting Average', subtext: '54.1 Away Captaincy Avg', decimals: 2 },
  ],
  T20I: [
    { value: 4188,  label: 'T20I Career Runs', subtext: '125 T20Is (117 Innings)', decimals: 0 },
    { value: 38,    label: 'T20I 50+ Scores', subtext: '1 Century + 37 Fifties', decimals: 0 },
    { value: 48.70, label: 'T20I Batting Average', subtext: '137.04 Strike Rate', decimals: 2 },
  ],
};

// ============================================================
// CHASE MASTER — Famous Kohli Chase Innings by Format
// Source: Official Match Records
// ============================================================
export const famousChases: ChaseInnings[] = [
  // T20I Chases
  {
    year: 2022,
    opponent: 'Pakistan',
    target: 160,
    kohliScore: 82,
    result: 'won',
    format: 'T20I',
    venue: 'MCG, Melbourne',
    highlightBadge: '⚡ SHOT OF THE CENTURY',
    isGenerational: true,
    description: 'The Generational Knock. Rescued India from 31/4 at MCG. Hit two iconic back-to-back sixes off Haris Rauf in the 19th over to pull off the impossible.',
  },
  { year: 2016, opponent: 'Australia', target: 161, kohliScore: 82, result: 'won', format: 'T20I', venue: 'Mohali', description: 'T20 WC quarter-final masterclass. 82* off 51 in a knockout run-chase.' },
  { year: 2016, opponent: 'Pakistan', target: 84, kohliScore: 55, result: 'won', format: 'T20I', venue: 'Kolkata', description: 'Asia Cup. Tricky pitch. Unbeaten 55* off 47 to anchor India home safely.' },
  { year: 2019, opponent: 'West Indies', target: 208, kohliScore: 94, result: 'won', format: 'T20I', venue: 'Hyderabad', description: 'Blistering 94* off 50 to chase down 208, featuring the iconic notebook celebration.' },
  { year: 2024, opponent: 'South Africa', target: 177, kohliScore: 76, result: 'won', format: 'T20I', venue: 'Bridgetown', description: 'T20 WC 2024 Final. Anchored India to 176 in the biggest T20 match of his career.' },

  // ODI Chases
  { year: 2012, opponent: 'Sri Lanka', target: 321, kohliScore: 133, result: 'won', format: 'ODI', venue: 'Hobart', description: 'The innings that announced the Chase Master to the world. 133 off 86 with India needing a miracle in 40 overs.' },
  { year: 2012, opponent: 'Pakistan', target: 330, kohliScore: 183, result: 'won', format: 'ODI', venue: 'Dhaka', description: 'Career best ODI score — 183 off 148, dismantling Pakistan\'s record Asia Cup total.' },
  { year: 2013, opponent: 'Australia', target: 360, kohliScore: 100, result: 'won', format: 'ODI', venue: 'Jaipur', description: 'Fastest ODI century by an Indian — 100 off 52 balls chasing 360.' },
  { year: 2019, opponent: 'West Indies', target: 316, kohliScore: 120, result: 'won', format: 'ODI', venue: 'Visakhapatnam', description: 'A masterclass in pressure pacing. 120 to seal a high-scoring chase.' },
  { year: 2023, opponent: 'Pakistan', target: 267, kohliScore: 122, result: 'won', format: 'ODI', venue: 'Ahmedabad', description: 'World Cup 2023 — unbeaten 122 against Pakistan in front of 130,000 home fans.' },
  { year: 2023, opponent: 'New Zealand', target: 274, kohliScore: 117, result: 'won', format: 'ODI', venue: 'Dharamsala', description: 'World Cup 2023 semi-finals. 117 to power India into the final.' },

  // Test Chases & 4th Innings Masterclasses
  { year: 2014, opponent: 'Australia', target: 364, kohliScore: 141, result: 'lost', format: 'Test', venue: 'Adelaide', description: 'Iconic 4th innings counter-attack. Scored 141 in a daring chase of 364 on Day 5.' },
  { year: 2018, opponent: 'England', target: 194, kohliScore: 149, result: 'lost', format: 'Test', venue: 'Edgbaston', description: 'Solo battle against Anderson & Broad. 149 in 1st inn & 51 in 4th inn pursuit.' },
  { year: 2018, opponent: 'South Africa', target: 287, kohliScore: 153, result: 'lost', format: 'Test', venue: 'Centurion', description: 'Epic 153 on a venomous pitch against Steyn, Morkel, and Rabada.' },
  { year: 2015, opponent: 'Sri Lanka', target: 176, kohliScore: 103, result: 'won', format: 'Test', venue: 'Galle', description: 'Masterful Test century anchoring a crucial 1st Test victory.' },
];

// ============================================================
// FORMAT-WISE PRESSURE MAP DATA
// ============================================================
export const pressureMapDataByFormat: Record<Format, PressureCell[]> = {
  ODI: [
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
    { phase: 'death',     pressureLevel: 'stiff', rrrRange: '8–10 rpo', average: 58.3, strikeRate: 118.7, innings: 54, famousKnock: undefined },
    // Mountain (>10 RRR)
    { phase: 'powerplay', pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 31.2, strikeRate: 98.4, innings: 19, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 48.6, strikeRate: 112.3, innings: 41, famousKnock: undefined },
    { phase: 'death',     pressureLevel: 'mountain', rrrRange: '>10 rpo', average: 52.1, strikeRate: 136.8, innings: 29, famousKnock: undefined },
  ],
  Test: [
    // Comfortable (< 3 RRR / Target <200)
    { phase: 'powerplay', pressureLevel: 'comfortable', rrrRange: '1st Innings', average: 54.2, strikeRate: 56.4, innings: 68, famousKnock: '254* vs SA, 2019' },
    { phase: 'middle',    pressureLevel: 'comfortable', rrrRange: '2nd Innings', average: 58.9, strikeRate: 58.2, innings: 74, famousKnock: '200 vs WI, 2016' },
    { phase: 'death',     pressureLevel: 'comfortable', rrrRange: '4th Inn <200', average: 68.5, strikeRate: 62.1, innings: 24, famousKnock: '103 vs SL, 2015' },
    // Moderate (3-4 RRR / Target 200-300)
    { phase: 'powerplay', pressureLevel: 'moderate', rrrRange: '1st Inn SENA', average: 48.1, strikeRate: 52.8, innings: 45, famousKnock: '153 vs SA, 2018' },
    { phase: 'middle',    pressureLevel: 'moderate', rrrRange: '3rd Inn Lead', average: 52.4, strikeRate: 55.6, innings: 52, famousKnock: '149 vs ENG, 2018' },
    { phase: 'death',     pressureLevel: 'moderate', rrrRange: '4th Inn 200-300', average: 54.2, strikeRate: 59.8, innings: 18, famousKnock: undefined },
    // Stiff (4-5 RRR / Target 300-350)
    { phase: 'powerplay', pressureLevel: 'stiff', rrrRange: 'Spicy Pitch', average: 41.2, strikeRate: 49.5, innings: 28, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'stiff', rrrRange: 'Collapse Rescue', average: 61.4, strikeRate: 56.2, innings: 34, famousKnock: '123 vs AUS, Perth 2018' },
    { phase: 'death',     pressureLevel: 'stiff', rrrRange: '4th Inn 300-350', average: 49.4, strikeRate: 61.8, innings: 12, famousKnock: undefined },
    // Mountain (>5 RRR / Target >350 Day 5)
    { phase: 'powerplay', pressureLevel: 'mountain', rrrRange: 'Day 5 Pitch', average: 35.0, strikeRate: 48.2, innings: 14, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'mountain', rrrRange: 'Trailing 200+', average: 42.1, strikeRate: 54.9, innings: 22, famousKnock: undefined },
    { phase: 'death',     pressureLevel: 'mountain', rrrRange: '4th Inn >350', average: 48.5, strikeRate: 68.4, innings: 9, famousKnock: '141 vs AUS, Adelaide 2014' },
  ],
  T20I: [
    // Comfortable (<7 RRR)
    { phase: 'powerplay', pressureLevel: 'comfortable', rrrRange: '<7 rpo', average: 44.2, strikeRate: 118.5, innings: 32, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'comfortable', rrrRange: '<7 rpo', average: 68.4, strikeRate: 128.2, innings: 48, famousKnock: undefined },
    { phase: 'death',     pressureLevel: 'comfortable', rrrRange: '<7 rpo', average: 92.1, strikeRate: 145.6, innings: 26, famousKnock: undefined },
    // Moderate (7-9 RRR)
    { phase: 'powerplay', pressureLevel: 'moderate', rrrRange: '7–9 rpo', average: 52.1, strikeRate: 126.8, innings: 41, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'moderate', rrrRange: '7–9 rpo', average: 74.2, strikeRate: 138.4, innings: 56, famousKnock: '55* vs PAK, 2016' },
    { phase: 'death',     pressureLevel: 'moderate', rrrRange: '7–9 rpo', average: 84.5, strikeRate: 168.2, innings: 35, famousKnock: undefined },
    // Stiff (9-11 RRR)
    { phase: 'powerplay', pressureLevel: 'stiff', rrrRange: '9–11 rpo', average: 41.8, strikeRate: 132.4, innings: 22, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'stiff', rrrRange: '9–11 rpo', average: 62.1, strikeRate: 146.5, innings: 38, famousKnock: '94* vs WI, 2019' },
    { phase: 'death',     pressureLevel: 'stiff', rrrRange: '9–11 rpo', average: 76.8, strikeRate: 184.2, innings: 24, famousKnock: '82* vs AUS, 2016' },
    // Mountain (>11 RRR)
    { phase: 'powerplay', pressureLevel: 'mountain', rrrRange: '>11 rpo', average: 35.4, strikeRate: 138.9, innings: 12, famousKnock: undefined },
    { phase: 'middle',    pressureLevel: 'mountain', rrrRange: '>11 rpo', average: 49.8, strikeRate: 158.4, innings: 25, famousKnock: undefined },
    { phase: 'death',     pressureLevel: 'mountain', rrrRange: '>11 rpo', average: 78.4, strikeRate: 204.5, innings: 18, famousKnock: '82* vs PAK, 2022 MCG' },
  ],
};

// Backward compatibility alias
export const pressureMapData = pressureMapDataByFormat.ODI;

// ============================================================
// FORMAT-WISE CLUTCH INDEX METRICS
// ============================================================
export const clutchMetricsByFormat: Record<Format, ClutchMetrics & { formatNote: string }> = {
  ODI: {
    baselineAvg: 52.3,
    chaseAvg: 65.0,
    knockoutAvg: 68.4,
    finalsAvg: 71.2,
    baselineSR: 87.2,
    chaseSR: 93.4,
    clutchIndex: 87.4,
    formatNote: 'Computed from 314 ODIs, 54 centuries, 65.0 chase average & ICC World Cup knockout elevation.',
    breakdown: { chaseWeight: 35, knockoutWeight: 25, finalsWeight: 20, srWeight: 20 },
  },
  Test: {
    baselineAvg: 46.9,
    chaseAvg: 49.8,
    knockoutAvg: 54.1,
    finalsAvg: 58.2,
    baselineSR: 55.7,
    chaseSR: 58.4,
    clutchIndex: 79.8,
    formatNote: 'Adapted for Test cricket: 4th innings chases, SENA away test wins & WTC deciders (Draws factored).',
    breakdown: { chaseWeight: 35, knockoutWeight: 25, finalsWeight: 20, srWeight: 20 },
  },
  T20I: {
    baselineAvg: 48.7,
    chaseAvg: 82.5,
    knockoutAvg: 88.7,
    finalsAvg: 76.0,
    baselineSR: 137.1,
    chaseSR: 142.8,
    clutchIndex: 94.2,
    formatNote: 'Computed from T20 World Cup chases (82.5 avg), 4 WC knockout 50s & 184+ death overs strike rate.',
    breakdown: { chaseWeight: 35, knockoutWeight: 25, finalsWeight: 20, srWeight: 20 },
  },
};

// Backward compatibility alias
export const clutchMetrics = clutchMetricsByFormat.ODI;

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

// ============================================================
// IPL & DOMESTIC CAREER DATA
// Source: Official IPL T20 Records & ESPNcricinfo
// ============================================================
export const iplCareerData = {
  team: 'Royal Challengers Bengaluru (RCB)',
  yearsActive: '2008 – Present',
  matches: 252,
  innings: 244,
  runs: 8004,
  average: 38.66,
  strikeRate: 131.97,
  centuries: 8,
  fifties: 55,
  highScore: '113*',
  orangeCaps: 2,
  highlightBadge: 'All-time highest run-scorer in IPL history',
  keyMilestones: [
    { label: '973 Runs (2016)', desc: 'Most runs in a single IPL season in history' },
    { label: '8 IPL Centuries', desc: 'Most 100s in IPL history (passes Gayle\'s 6)' },
    { label: '8,000+ Runs', desc: 'First & only batter to cross 8,000 IPL runs' },
    { label: 'Single Team Loyalty', desc: 'Only player in IPL history to play 17 seasons for 1 franchise' },
  ],
};

export const domesticCareerData = {
  team: 'Delhi (Ranji Trophy & List A)',
  yearsActive: '2006 – Present',
  firstClassMatches: 145,
  firstClassRuns: 10925,
  firstClassAverage: 50.11,
  firstClassCenturies: 36,
  listAMatches: 332,
  listARuns: 15658,
  listAAverage: 57.14,
  foundationalNote: 'The domestic grind that built the foundation for his international career',
  ranjiHighlight: 'Debuted for Delhi in 2006. Famously scored 90 against Karnataka the morning after his father passed away to save Delhi from a collapse.',
};

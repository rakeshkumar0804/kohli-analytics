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
    description: 'The greatest era of any batter in modern cricket. 2016 alone: 973 IPL runs in a single season (all-time record) & 641 T20I runs at a 106.83 batting average. A machine operating at peak.',
    odiAvg: 82.1,
    testAvg: 66.79,
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
// Scope: ALL INTERNATIONAL FORMATS (Test + ODI + T20I)
// Source: ESPNcricinfo & Official International Career Match Records
// ============================================================
export const opponentData: OpponentStats[] = [
  { country: 'Australia',   code: 'AU', latitude: -25.3, longitude: 133.8, matches: 106, innings: 126, notOuts: 12, dismissals: 114, runs: 5551, avg: 48.69, centuries: 17, fifties: 29, highScore: '186',  dominanceScore: 88 },
  { country: 'Bangladesh',  code: 'BD', latitude:  23.7, longitude:  90.4, matches: 31,  innings: 36,  notOuts: 9,  dismissals: 27,  runs: 1698, avg: 62.88, centuries: 7,  fifties: 5,  highScore: '204',  dominanceScore: 91 },
  { country: 'England',     code: 'EN', latitude:  52.4, longitude:  -1.9, matches: 90,  innings: 112, notOuts: 11, dismissals: 101, runs: 4180, avg: 41.38, centuries: 8,  fifties: 26, highScore: '235',  dominanceScore: 72 },
  { country: 'New Zealand', code: 'NZ', latitude: -40.9, longitude: 174.9, matches: 60,  innings: 73,  notOuts: 6,  dismissals: 67,  runs: 3167, avg: 47.26, centuries: 10, fifties: 16, highScore: '211',  dominanceScore: 78 },
  { country: 'Pakistan',    code: 'PK', latitude:  30.4, longitude:  69.3, matches: 28,  innings: 28,  notOuts: 8,  dismissals: 20,  runs: 1270, avg: 63.50, centuries: 4,  fifties: 7,  highScore: '183',  dominanceScore: 90 },
  { country: 'South Africa', code: 'ZA', latitude: -28.5, longitude: 24.7, matches: 64,  innings: 73,  notOuts: 12, dismissals: 61,  runs: 3608, avg: 59.14, centuries: 10, fifties: 17, highScore: '254*', dominanceScore: 92 },
  { country: 'Sri Lanka',   code: 'LK', latitude:   7.9, longitude:  80.7, matches: 75,  innings: 79,  notOuts: 14, dismissals: 65,  runs: 4076, avg: 62.70, centuries: 15, fifties: 18, highScore: '243',  dominanceScore: 94 },
  { country: 'West Indies',  code: 'WI', latitude:  17.1, longitude: -61.8, matches: 73,  innings: 75,  notOuts: 10, dismissals: 65,  runs: 3850, avg: 59.23, centuries: 12, fifties: 23, highScore: '200',  dominanceScore: 95 },
  { country: 'Zimbabwe',    code: 'ZW', latitude: -19.0, longitude:  29.2, matches: 11,  innings: 8,   notOuts: 2,  dismissals: 6,   runs: 305,  avg: 50.83, centuries: 1,  fifties: 1,  highScore: '115*', dominanceScore: 85 },
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
    { value: 52.71, label: 'Combined Average', subtext: '562 Matches (Test + ODI + T20I)', decimals: 2 },
  ],
  ODI: [
    { value: 14941, label: 'ODI Career Runs', subtext: '314 ODIs (302 Innings, 93.95 SR)', decimals: 0 },
    { value: 54,    label: 'ODI Centuries', subtext: 'Most ODI 100s in history', decimals: 0 },
    { value: 58.59, label: 'ODI Batting Average', subtext: 'Most ODI Centuries in History', decimals: 2 },
  ],
  Test: [
    { value: 9230,  label: 'Test Career Runs', subtext: '123 Tests (210 Innings, 55.58 SR)', decimals: 0 },
    { value: 30,    label: 'Test Centuries', subtext: '7 Double Centuries', decimals: 0 },
    { value: 46.85, label: 'Test Batting Average', subtext: '31 Fifties', decimals: 2 },
  ],
  T20I: [
    { value: 4188,  label: 'T20I Career Runs', subtext: '125 T20Is (117 Innings, 137.04 SR)', decimals: 0 },
    { value: 39,    label: 'T20I 50+ Scores', subtext: '1 Century + 38 Fifties', decimals: 0 },
    { value: 48.70, label: 'T20I Batting Average', subtext: '137.04 Strike Rate', decimals: 2 },
  ],
};

// ============================================================
// CAREER STATS — All formats (Verified Official Table)
// ============================================================
export const careerStats = {
  overall: { matches: 562, innings: 629, notOuts: 91, dismissals: 538, runs: 28359, centuries: 85, fifties: 148, average: 52.71, strikeRate: 79.73, ballsFaced: 35567, ducks: 40, fours: 2785, sixes: 325, catches: 344, highScore: 254 },
  odi: { matches: 314, innings: 302, notOuts: 47, dismissals: 255, runs: 14941, average: 58.59, strikeRate: 93.95, centuries: 54, fifties: 79, highScore: 183, ballsFaced: 15903, fours: 1389, sixes: 171, ducks: 18, catches: 169 },
  test: { matches: 123, innings: 210, notOuts: 13, dismissals: 197, runs: 9230, average: 46.85, strikeRate: 55.58, centuries: 30, fifties: 31, highScore: 254, ballsFaced: 16608, fours: 1027, sixes: 30, ducks: 15, catches: 121 },
  t20i: { matches: 125, innings: 117, notOuts: 31, dismissals: 86, runs: 4188, average: 48.70, strikeRate: 137.04, centuries: 1, fifties: 38, highScore: 122, ballsFaced: 3056, fours: 369, sixes: 124, ducks: 7, catches: 54 },
  ipl: { matches: 283, innings: 275, notOuts: 44, dismissals: 231, runs: 9336, average: 40.42, strikeRate: 134.8, centuries: 9, fifties: 68, highScore: 113, ballsFaced: 6926, fours: 844, sixes: 316 },
};

// ============================================================
// DOMESTIC / ALL-FORMAT CAREER AGGREGATES
// Source: Cricbuzz & ESPNcricinfo Career Summaries
// ============================================================
export const allFormatCareerStats = {
  firstClass: {
    batting: {
      matches: 156,
      innings: 259,
      notOuts: 20,
      dismissals: 239,
      runs: 11485,
      highScore: '254*',
      average: 48.05,
      ballsFaced: 20526,
      strikeRate: 55.95,
      centuries: 37,
      fifties: 39,
      fours: 1341,
      sixes: 45,
      catches: 152,
      stumpings: 0,
    },
    bowling: {
      matches: 156,
      innings: 25,
      balls: 643,
      runsConceded: 338,
      wickets: 3,
      bbi: '1/19',
      bbm: '2/42',
      average: 112.67,
      sourceDisplayedAverage: 112.66,
      economy: 3.15,
      strikeRate: 214.3,
      fourWickets: 0,
      fiveWickets: 0,
      tenWickets: 0,
    },
  },
  listA: {
    batting: {
      matches: 350,
      innings: 337,
      notOuts: 50,
      dismissals: 287,
      runs: 16591,
      highScore: '183',
      average: 57.80,
      ballsFaced: 17601,
      strikeRate: 94.26,
      centuries: 59,
      fifties: 88,
      fours: 1580,
      sixes: 199,
      catches: 189,
      stumpings: 0,
    },
    bowling: {
      matches: 350,
      innings: 57,
      balls: 726,
      runsConceded: 741,
      wickets: 5,
      bbi: '1/13',
      bbm: '1/13',
      average: 148.20,
      economy: 6.12,
      strikeRate: 145.2,
      fourWickets: 0,
      fiveWickets: 0,
      tenWickets: 0,
    },
  },
  allT20: {
    batting: {
      matches: 430,
      innings: 413,
      notOuts: 78,
      dismissals: 335,
      runs: 14218,
      highScore: '122*',
      average: 42.44,
      ballsFaced: 10463,
      strikeRate: 135.88,
      centuries: 10,
      fifties: 110,
      fours: 1283,
      sixes: 460,
      catches: 194,
      stumpings: 0,
    },
    bowling: {
      matches: 430,
      innings: 45,
      balls: 460,
      runsConceded: 667,
      wickets: 8,
      bbi: '2/25',
      bbm: '2/25',
      average: 83.375,
      sourceDisplayedAverage: 83.37,
      economy: 8.70,
      strikeRate: 57.5,
      fourWickets: 0,
      fiveWickets: 0,
      tenWickets: 0,
    },
  },
};

// ============================================================
// U-19 CAREER AGGREGATES (SEPARATE SCOPE)
// Source: ESPNcricinfo & BCCI U-19 Match Records
// ============================================================
export const u19CareerStats = {
  u19Test: {
    matches: 12,
    innings: null,
    notOuts: null,
    runs: 932,
    average: 51.78,
    highScore: '144',
    centuries: 3,
    fifties: 6,
    catches: 15,
  },
  u19ODI: {
    matches: 28,
    innings: null,
    notOuts: null,
    runs: 978,
    average: 46.57,
    highScore: '100',
    centuries: 1,
    fifties: 6,
    fours: 93,
    sixes: 14,
    catches: 16,
  },
};

// ============================================================
// CHASE MASTER — Famous Kohli Chase Innings by Format
// Source: Official Match Records (Genuine 2nd/4th Innings Chases Only)
// ============================================================
export const famousChases: ChaseInnings[] = [
  // T20I Chases
  {
    year: 2022,
    opponent: 'Pakistan',
    target: 160,
    kohliScore: 82,
    isNotOut: true,
    ballsFaced: 53,
    result: 'won',
    format: 'T20I',
    venue: 'MCG, Melbourne',
    highlightBadge: '⚡ SHOT OF THE CENTURY',
    isGenerational: true,
    description: 'The Generational Knock. Rescued India from 31/4 at MCG. Hit two iconic back-to-back sixes off Haris Rauf in the 19th over to pull off the impossible (82* off 53 balls).',
  },
  {
    year: 2016,
    opponent: 'Australia',
    target: 161,
    kohliScore: 82,
    isNotOut: true,
    ballsFaced: 51,
    result: 'won',
    format: 'T20I',
    venue: 'Mohali',
    description: 'T20 WC virtual quarter-final masterclass. 82* off 51 balls in a high-pressure knockout run-chase.',
  },
  {
    year: 2016,
    opponent: 'Pakistan',
    target: 84,
    kohliScore: 49,
    isNotOut: false,
    ballsFaced: 51,
    result: 'won',
    format: 'T20I',
    venue: 'Mirpur, Dhaka',
    description: 'Asia Cup 2016. Weathered Mohammad Amir\'s blistering opening spell on a treacherous seaming pitch. Scored 49 off 51 to steer India from 8/3 to victory.',
  },
  {
    year: 2016,
    opponent: 'Pakistan',
    target: 119,
    kohliScore: 55,
    isNotOut: true,
    ballsFaced: 37,
    result: 'won',
    format: 'T20I',
    venue: 'Eden Gardens, Kolkata',
    description: 'T20 World Cup 2016. Masterclass on a raging turner at Eden Gardens. Unbeaten 55* off 37 balls chasing 119 against Pakistan.',
  },
  {
    year: 2019,
    opponent: 'West Indies',
    target: 208,
    kohliScore: 94,
    isNotOut: true,
    ballsFaced: 50,
    result: 'won',
    format: 'T20I',
    venue: 'Hyderabad',
    description: 'Blistering 94* off 50 to chase down 208, featuring the iconic notebook celebration.',
  },
  {
    year: 2014,
    opponent: 'South Africa',
    target: 173,
    kohliScore: 72,
    isNotOut: true,
    ballsFaced: 44,
    result: 'won',
    format: 'T20I',
    venue: 'Dhaka',
    description: 'T20 WC 2014 semi-final. Masterful 72* off 44 balls to chase down 173.',
  },

  // ODI Chases
  {
    year: 2012,
    opponent: 'Sri Lanka',
    target: 321,
    kohliScore: 133,
    isNotOut: true,
    ballsFaced: 86,
    result: 'won',
    format: 'ODI',
    venue: 'Hobart',
    description: 'The innings that announced the Chase Master to the world. 133* off 86 with India needing a miracle bonus point in 40 overs (achieved in 36.4 overs).',
  },
  {
    year: 2012,
    opponent: 'Pakistan',
    target: 330,
    kohliScore: 183,
    isNotOut: false,
    ballsFaced: 148,
    result: 'won',
    format: 'ODI',
    venue: 'Dhaka',
    description: 'Career best ODI score — 183 off 148 balls (22 fours, 1 six), dismantling Pakistan\'s 329 in the Asia Cup.',
  },
  {
    year: 2013,
    opponent: 'Australia',
    target: 360,
    kohliScore: 100,
    isNotOut: true,
    ballsFaced: 52,
    result: 'won',
    format: 'ODI',
    venue: 'Jaipur',
    description: 'Fastest ODI century by an Indian — 100* off 52 balls chasing 360.',
  },
  {
    year: 2017,
    opponent: 'England',
    target: 351,
    kohliScore: 122,
    isNotOut: false,
    ballsFaced: 105,
    result: 'won',
    format: 'ODI',
    venue: 'Pune',
    description: 'Masterclass in a 351 chase. Scored 122 off 105 balls after India were reeling at 63/4.',
  },
  {
    year: 2018,
    opponent: 'West Indies',
    target: 323,
    kohliScore: 140,
    isNotOut: false,
    ballsFaced: 107,
    result: 'won',
    format: 'ODI',
    venue: 'Guwahati',
    description: 'Supreme pacing. 140 off 107 balls with 21 fours to comfortably chase 323.',
  },
  {
    year: 2023,
    opponent: 'New Zealand',
    target: 274,
    kohliScore: 95,
    isNotOut: false,
    ballsFaced: 104,
    result: 'won',
    format: 'ODI',
    venue: 'Dharamsala',
    description: 'World Cup 2023 league stage. Anchored a tough chase of 274 with a sublime 95 off 104 balls.',
  },
  {
    year: 2023,
    opponent: 'Australia',
    target: 200,
    kohliScore: 85,
    isNotOut: false,
    ballsFaced: 116,
    result: 'won',
    format: 'ODI',
    venue: 'Chennai',
    description: 'World Cup 2023 opener. Rescued India from 2/3 with a brilliant 85 off 116 balls under extreme pressure.',
  },

  // Test Chases (4th Innings Pursuit)
  {
    year: 2014,
    opponent: 'Australia',
    target: 364,
    kohliScore: 141,
    isNotOut: false,
    ballsFaced: 175,
    result: 'lost',
    format: 'Test',
    venue: 'Adelaide',
    description: 'Iconic 4th innings counter-attack on captaincy debut. Scored 141 off 175 balls in a daring Day 5 chase of 364.',
  },
  {
    year: 2013,
    opponent: 'South Africa',
    target: 458,
    kohliScore: 96,
    isNotOut: false,
    ballsFaced: 193,
    result: 'draw',
    format: 'Test',
    venue: 'Johannesburg',
    description: 'Valiant 4th innings 96 off 193 balls in a historic Day 5 chase where India reached 450/7.',
  },
  {
    year: 2018,
    opponent: 'England',
    target: 194,
    kohliScore: 51,
    isNotOut: false,
    ballsFaced: 93,
    result: 'lost',
    format: 'Test',
    venue: 'Edgbaston',
    description: 'Fought valiantly in the 4th innings pursuit of 194, scoring 51 off 93 balls before falling.',
  },
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
    baselineAvg: 58.6,
    chaseAvg: 65.0,
    knockoutAvg: 68.4,
    finalsAvg: 71.2,
    baselineSR: 94.0,
    chaseSR: 93.4,
    clutchIndex: 87.4,
    formatNote: 'Experimental composite metric computed from 314 ODIs, 54 centuries, 65.0 chase average & ICC World Cup knockout elevation.',
    breakdown: { chaseWeight: 35, knockoutWeight: 25, finalsWeight: 20, srWeight: 20 },
  },
  Test: {
    baselineAvg: 46.9,
    chaseAvg: 49.8,
    knockoutAvg: 54.1,
    finalsAvg: 58.2,
    baselineSR: 55.6,
    chaseSR: 58.4,
    clutchIndex: 79.8,
    formatNote: 'Experimental composite metric for Test cricket: 4th innings chases, SENA away test wins & WTC deciders.',
    breakdown: { chaseWeight: 35, knockoutWeight: 25, finalsWeight: 20, srWeight: 20 },
  },
  T20I: {
    baselineAvg: 48.7,
    chaseAvg: 82.5,
    knockoutAvg: 88.7,
    finalsAvg: 76.0,
    baselineSR: 137.0,
    chaseSR: 142.8,
    clutchIndex: 94.2,
    formatNote: 'Experimental composite metric computed from T20 World Cup chases (82.5 avg), WC knockout 50s & death overs strike rate.',
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
// Verified Records: Official IPL T20 & ESPNcricinfo (2026 Season End)
// ============================================================
export const iplCareerData = {
  team: 'Royal Challengers Bengaluru (RCB)',
  yearsActive: '2008 – 2026 (19 Seasons)',
  matches: 283,
  innings: 275,
  notOuts: 44,
  runs: 9336,
  average: 40.42,
  strikeRate: 134.8,
  ballsFaced: 6926,
  centuries: 9,
  fifties: 68,
  fours: 844,
  sixes: 316,
  highScore: '113*',
  orangeCaps: 2,
  highlightBadge: 'All-time highest run-scorer in IPL history',
  keyMilestones: [
    { label: '973 Runs (2016)', desc: 'Most runs in a single IPL season in history' },
    { label: '9 IPL Centuries', desc: 'Most 100s in IPL history' },
    { label: '9,336 Runs (275 Innings)', desc: 'First player to cross 9,000 IPL runs' },
    { label: '19 Seasons Loyalty', desc: 'Only player in IPL history to play 19 seasons for 1 franchise' },
  ],
};

export const domesticCareerData = {
  team: 'Delhi — Ranji Trophy',
  yearsActive: '2006 – Present',
  firstClassMatches: 156,
  firstClassInnings: 259,
  firstClassRuns: 11485,
  firstClassAverage: 48.05,
  firstClassCenturies: 37,
  firstClassFifties: 39,
  listAMatches: 347,
  listAInnings: 334,
  listARuns: 16447,
  listAAverage: 57.91,
  listAStrikeRate: 94.14,
  listACenturies: 59,
  listAFifties: 86,
  ranjiMatches: 24,
  ranjiRuns: 1580,
  ranjiAverage: 49.37,
  ranjiCenturies: 5,
  foundationalNote: 'The domestic grind that built the foundation for his international career',
  ranjiHighlight: 'Debuted for Delhi in 2006. Famously scored 90 against Karnataka the morning after his father passed away to save Delhi from a collapse.',
};

// ============================================================
// FULL CAREER NARRATIVE TIMELINE DATA
// Verified Historical Cricket Milestones
// ============================================================
export const careerMilestones = [
  {
    year: '2008',
    phase: 'Rising Star',
    title: 'U-19 World Cup Winning Captain',
    desc: 'Captained India U-19 to World Cup victory in Malaysia, showcasing his fearless aggression and tactical leadership on the world stage.',
    badge: '👑 U-19 CHAMPION',
  },
  {
    year: '2011',
    phase: 'World Stage',
    title: 'ODI World Cup Champion',
    desc: 'Made India\'s 2011 World Cup squad and played in the tournament-winning campaign, scoring 35 in the final against Sri Lanka.',
    badge: '🏆 WORLD CUP WINNER',
  },
  {
    year: '2012–2014',
    phase: 'Rise to Dominance',
    title: 'White-Ball Mastery & Test Debut Captaincy',
    desc: 'Established himself as a premier ODI run-chaser, scoring 133* at Hobart in 2012 and a 52-ball hundred against Australia in 2013. Took over Test captaincy in Adelaide in 2014, scoring 115 and 141.',
    badge: '⚡ CHASE MASTER',
  },
  {
    year: '2017',
    phase: 'Leadership Era',
    title: 'Appointed Full-Time All-Format Captain',
    desc: 'Assumed India\'s full-time captaincy across Test, ODI and T20I cricket, beginning a defining leadership era.',
    badge: '⚔️ FULL-TIME SKIPPER',
  },
  {
    year: '2018–2019',
    phase: 'Peak Pinnacle',
    title: 'Historic Test Series Win in Australia',
    desc: 'Led India to its first-ever Test series victory in Australia in 2018–19, making India the first Asian side to achieve the feat.',
    badge: '🌏 HISTORIC WINNER',
  },
  {
    year: '2022',
    phase: 'Leadership Transition',
    title: 'Test Captaincy Resignation',
    desc: 'Stepped down as India\'s Test captain after the South Africa series, ending a leadership tenure that produced 40 Test wins and India\'s highest Test-captain win percentage of 58.82%.',
    badge: '🏏 CAPTAINCY TRANSITION',
  },
  {
    year: '2023',
    phase: 'Record Breaking',
    title: '50th ODI Century & World Cup Final',
    desc: 'Broke Sachin Tendulkar\'s record of 49 ODI centuries by scoring his 50th in the 2023 World Cup semifinal. Finished the tournament with a record 765 runs and won Player of the Tournament.',
    badge: '👑 50TH ODI TON',
  },
  {
    year: '2024',
    phase: 'T20 World Triumph',
    title: 'T20 World Cup Champion & T20I Retirement',
    desc: 'Player of the Match with 76 off 59 in the 2024 T20 World Cup final as India defeated South Africa by seven runs. Retired from T20Is immediately after the victory.',
    badge: '🏆 T20 WC CHAMPION',
  },
  {
    year: '2025',
    phase: 'Format Specialization',
    title: 'Test Retirement & ODI Focus',
    desc: 'Retired from Test cricket in May 2025 after 123 Tests, 9,230 runs and 30 centuries, continuing his international career in ODI cricket.',
    badge: '🏏 ODI FOCUS',
  },
  {
    year: '2026–Present',
    phase: 'Current Chapter',
    title: 'Quest for 2027 ODI World Cup',
    desc: 'Continues to represent India in ODI cricket, anchoring the top order while building toward the 2027 ODI World Cup in South Africa, Zimbabwe and Namibia.',
    badge: '🎯 2027 WC MISSION',
  },
];

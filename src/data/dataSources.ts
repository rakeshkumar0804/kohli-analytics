// ============================================================
// DATA PROVENANCE & SOURCES MANIFEST
// Phase 1 Data Integrity Freeze
// ============================================================

export const DATA_VERIFIED_ON = '2026-09-21';
export const DATA_VERIFIED_ON_FORMATTED = '21 September 2026';

export const STRUCTURAL_VALIDATION_DISCLAIMER = 
  'AUTOMATED SUITE DISCLAIMER: The validation suite (npm run validate:data) proves mathematical and structural self-consistency of stored data structures (e.g., averages matching runs / dismissals, non-negative bounds), not historical scorecard accuracy against live external databases.';

export const PHASE_4_SECURITY_NOTICE = 
  'PHASE 4 SECURITY REMEDIATION: Hardcoded client-side API key has been removed from src/api/cricketData.ts. In client-side Vite builds, browser environment variables are public and cannot secure upstream credentials. The previously committed key (<REDACTED_API_KEY>) must be treated as exposed and rotated on the CricketData.org provider dashboard. Production live fixture integration requires a server-side proxy route with server-only credentials.';

export type DataClassification = 
  | 'official-source' 
  | 'reference-aggregate' 
  | 'scorecard-derived' 
  | 'editorial' 
  | 'experimental';

export interface DataSourceEntry {
  datasetKey: string;
  datasetName: string;
  formatScope: 'ODI' | 'Test' | 'T20I' | 'IPL' | 'All International' | 'Domestic' | 'Multi-Format' | 'General';
  classification: DataClassification;
  sourceName: string;
  sourceUrl: string | null;
  referenceLandingPage?: string;
  statsThroughDate: string | null;
  coverageNote?: string;
  formatCoverageDates?: Record<string, string | null>;
  verifiedOnDate: string;
  verificationMethod: string;
  verificationStatus: 'verified' | 'partially-verified' | 'pending-source' | 'experimental';
  limitationDisclaimer: string;
  methodologyNote?: string;
}

export const DATA_PROVENANCE_MANIFEST: DataSourceEntry[] = [
  {
    datasetKey: 'careerStats',
    datasetName: 'International & IPL Career Totals',
    formatScope: 'Multi-Format',
    classification: 'reference-aggregate',
    sourceName: 'Cricbuzz Career Profile & ESPNcricinfo Statsguru',
    sourceUrl: 'https://www.cricbuzz.com/profiles/1413/virat-kohli',
    referenceLandingPage: 'https://www.cricbuzz.com',
    statsThroughDate: null,
    coverageNote: 'Coverage varies by format. Last included Test in supplied evidence: 3 January 2025 vs Australia. Last included ODI in supplied evidence: 19 July 2026 vs England. Last included T20I in supplied evidence: 29 June 2024 vs South Africa. IPL: snapshot cutoff date pending.',
    formatCoverageDates: {
      Test: '2025-01-03',
      ODI: '2026-07-19',
      T20I: '2024-06-29',
      IPL: null,
    },
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Automated structural validation checking runs / dismissals arithmetic, component sum assertions, and manual cross-reference against Cricbuzz profile career tables.',
    verificationStatus: 'verified',
    limitationDisclaimer: 'Aggregates represent static career totals; coverage dates vary by format. A single statsThroughDate is not applicable to this multi-format dataset.',
  },
  {
    datasetKey: 'heroStatsByFormat',
    datasetName: 'Hero Section Format Breakdown Counters',
    formatScope: 'Multi-Format',
    classification: 'reference-aggregate',
    sourceName: 'Derived from careerStats',
    sourceUrl: null,
    referenceLandingPage: 'https://www.cricbuzz.com/profiles/1413/virat-kohli',
    statsThroughDate: null,
    coverageNote: 'Coverage varies by format; inherits format-specific dates from careerStats.',
    formatCoverageDates: {
      Test: '2025-01-03',
      ODI: '2026-07-19',
      T20I: '2024-06-29',
    },
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Automated assertion confirming heroStatsByFormat.ALL matches careerStats.overall values exactly.',
    verificationStatus: 'verified',
    limitationDisclaimer: 'Visual summary snapshot derived directly from main career totals.',
  },
  {
    datasetKey: 'opponentData',
    datasetName: 'Opponent Dominance Dataset (9 Test Nations)',
    formatScope: 'All International',
    classification: 'reference-aggregate',
    sourceName: 'ESPNcricinfo Statsguru Opposition Breakdown (Test + ODI + T20I)',
    sourceUrl: 'https://stats.espncricinfo.com/ci/engine/player/253802.html?class=11;template=results;type=batting',
    statsThroughDate: null,
    coverageNote: 'Coverage varies by format; inherits format-specific dates from careerStats.',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Automated check verifying dismissals === (innings - notOuts) and Math.abs(runs / dismissals - avg) < 0.05 for all 9 countries, with exact value assertions per country.',
    verificationStatus: 'verified',
    limitationDisclaimer: 'Combined international formats only; excludes IPL and domestic fixtures. Base inputs (matches, innings, runs, average, centuries, fifties, highScore) are verified reference aggregates. dominanceScore is an experimental map-intensity heuristic derived from verified opponent aggregates; weighting is not an official cricket statistic.',
    methodologyNote: 'Base inputs: reference-aggregate (verified). dominanceScore: experimental editorial-derived map-intensity heuristic.',
  },
  {
    datasetKey: 'eraData',
    datasetName: 'Career Phase Segmentation (5 Eras)',
    formatScope: 'All International',
    classification: 'editorial',
    sourceName: 'Curated Career Phase Aggregates',
    sourceUrl: null,
    referenceLandingPage: 'https://stats.espncricinfo.com/ci/engine/player/253802.html',
    statsThroughDate: null,
    coverageNote: 'Coverage varies by format; phase boundaries are editorial groupings.',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Range boundary verification against published career summaries.',
    verificationStatus: 'partially-verified',
    limitationDisclaimer: 'Phase boundaries are editorial analytical groupings. Per-era aggregates are not independently reproduced from individual scorecards.',
  },
  {
    datasetKey: 'yearlyODIAvg',
    datasetName: 'Year-by-Year ODI Batting Average Progression (2008–2024)',
    formatScope: 'ODI',
    classification: 'reference-aggregate',
    sourceName: 'ESPNcricinfo Statsguru Annual Batting Aggregates',
    sourceUrl: 'https://stats.espncricinfo.com/ci/engine/player/253802.html?class=2;template=results;type=batting;view=years',
    statsThroughDate: '2026-07-19',
    coverageNote: 'Last included ODI in supplied evidence: 19 July 2026 vs England.',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Annual average calculations matched against yearly ESPNcricinfo summaries.',
    verificationStatus: 'verified',
    limitationDisclaimer: 'Covers calendar year ODI averages only.',
  },
  {
    datasetKey: 'captaincy data',
    datasetName: 'Captaincy Records (Test & International)',
    formatScope: 'Test',
    classification: 'reference-aggregate',
    sourceName: 'ESPNcricinfo Statsguru Captaincy Records',
    sourceUrl: 'https://stats.espncricinfo.com/ci/engine/player/253802.html?class=1;template=results;type=captain',
    statsThroughDate: '2022-01-15',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'W/L/D sum check (40 + 17 + 11 = 68 Tests) and win % check (40/68 = 58.82%).',
    verificationStatus: 'verified',
    limitationDisclaimer: 'Focuses strictly on Test leadership records and comparative peer win rates.',
  },
  {
    datasetKey: 'IPL data',
    datasetName: 'IPL Franchise Career Records',
    formatScope: 'IPL',
    classification: 'reference-aggregate',
    sourceName: 'IPLT20.com Stats Portal & Cricbuzz Profile',
    sourceUrl: null,
    referenceLandingPage: 'https://www.iplt20.com/stats/all-time',
    statsThroughDate: null,
    coverageNote: 'Current IPL aggregate snapshot (283 matches, 9,336 runs); specific match cutoff date and stable player-filtered URL pending.',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Automated check verifying Math.abs(runs / (innings - notOuts) - average) < 0.1 (9,336 runs / 231 dismissals = 40.42 avg).',
    verificationStatus: 'partially-verified',
    limitationDisclaimer: 'Covers IPL franchise matches only; distinct from international T20Is. Generic stats page does not provide a stable player-filtered evidence URL.',
  },
  {
    datasetKey: 'famousChases',
    datasetName: 'Famous Chase Innings Gallery',
    formatScope: 'Multi-Format',
    classification: 'editorial',
    sourceName: 'Curated from ESPNcricinfo Match Scorecards',
    sourceUrl: null,
    referenceLandingPage: 'https://www.espncricinfo.com',
    statsThroughDate: '2023-11-05',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Automated metadata check verifying target, score, year, venue, opponent, result, and non-duplicate entry invariant.',
    verificationStatus: 'pending-source',
    methodologyNote: 'Individual scorecard URLs per chase entry are not yet stored. Classification will upgrade to scorecard-derived when per-entry URLs are added and aggregation code exists.',
    limitationDisclaimer: 'Curated portfolio of famous chases. Individual scorecard evidence URLs pending.',
  },
  {
    datasetKey: 'legendsComparisonData',
    datasetName: 'Legends Showdown Peer Benchmarks',
    formatScope: 'Multi-Format',
    classification: 'reference-aggregate',
    sourceName: 'ESPNcricinfo Career Summaries (Sachin, Ponting, Rohit, Smith, Root, Williamson, Babar)',
    sourceUrl: null,
    referenceLandingPage: 'https://stats.espncricinfo.com',
    statsThroughDate: '2026-07-19',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Kohli values verified via automated component sum assertions. Peer career aggregates manually cross-referenced against ESPNcricinfo profiles.',
    verificationStatus: 'partially-verified',
    limitationDisclaimer: 'Peer stats reflect static reference snapshot. Per-player source URLs are not individually stored. Situational metrics (chaseAvg, knockoutAvg) are experimental.',
  },
  {
    datasetKey: 'quiz answers',
    datasetName: 'Trivia Quiz Questions & Fact Verification Key',
    formatScope: 'General',
    classification: 'editorial',
    sourceName: 'Cricket Records & Match Logs',
    sourceUrl: null,
    referenceLandingPage: 'https://www.espncricinfo.com',
    statsThroughDate: null,
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Fact-checking trivia questions against match logs.',
    verificationStatus: 'pending-source',
    limitationDisclaimer: 'Educational quiz items. Per-answer record-level source URLs pending.',
  },
  {
    datasetKey: 'timeline milestones',
    datasetName: 'Career Timeline Milestones (2008–2026)',
    formatScope: 'Multi-Format',
    classification: 'editorial',
    sourceName: 'ICC Tournament Match Logs & News Archives',
    sourceUrl: null,
    referenceLandingPage: 'https://www.espncricinfo.com',
    statsThroughDate: null,
    coverageNote: 'Coverage varies by format; inherits format-specific dates from careerStats.',
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Historical validation of dates, opponent titles, and tournament outcomes.',
    verificationStatus: 'pending-source',
    limitationDisclaimer: 'Chronological milestones highlight key career inflection points. Per-milestone source URLs pending.',
  },
  {
    datasetKey: 'Clutch Index inputs',
    datasetName: 'Clutch Index Situational Batting Model',
    formatScope: 'All International',
    classification: 'experimental',
    sourceName: 'Experimental Situational Model (Calibration Pending)',
    sourceUrl: null,
    statsThroughDate: null,
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Formula check; raw chase and knockout inputs marked as experimental pending ball-by-ball derivation.',
    verificationStatus: 'experimental',
    methodologyNote: 'EXPERIMENTAL INPUT — raw chase and knockout averages pending ball-by-ball source derivation.',
    limitationDisclaimer: 'Experimental composite model undergoing ball-by-ball calibration; not an official ICC stat.',
  },
  {
    datasetKey: 'Pressure Map values',
    datasetName: 'Situational Pressure Map Grid (Phase × RRR)',
    formatScope: 'All International',
    classification: 'experimental',
    sourceName: 'Experimental Situational Performance Grid',
    sourceUrl: null,
    statsThroughDate: null,
    verifiedOnDate: DATA_VERIFIED_ON,
    verificationMethod: 'Grid range and boundary validation.',
    verificationStatus: 'experimental',
    methodologyNote: 'EXPERIMENTAL PLACEHOLDER — ball-by-ball situation model derivation pending.',
    limitationDisclaimer: 'Experimental situational grid mapping performance across discretized chase bins.',
  },
];

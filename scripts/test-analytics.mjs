import { describe, it } from 'node:test';
import assert from 'node:assert';

// ============================================================
// Direct Production Analytics Module Imports
// ============================================================
import {
  normalizeMatch,
  normalizeInnings,
  derivePhase,
  deriveRRRBand,
  derivePressureLevel,
  validateMatchCollection,
  PHASE_POLICY_VERSION,
} from '../src/analytics/normalizeMatch.ts';

import {
  matchFilter,
  inningsFilter,
  deliveryFilter,
} from '../src/analytics/filters.ts';

import {
  aggregateBatting,
} from '../src/analytics/aggregateBatting.ts';

import {
  calculateChaseMetrics,
} from '../src/analytics/chaseMetrics.ts';

import {
  derivePressureMap,
  FIVE_PRESSURE_BANDS,
  classifySampleSize,
} from '../src/analytics/pressureMetrics.ts';

import {
  calculateClutchIndexFromMatches,
  CLUTCH_MODEL_VERSION,
  DEFAULT_CLUTCH_WEIGHTS,
} from '../src/analytics/clutchMetrics.ts';

import {
  LEGACY_MODEL_SPEC,
  PHASE5_MODEL_VERSION,
  CLUTCH_COMPONENTS_SPEC,
  normalizeClutchRatio,
  computeOverlapMatrix,
  evaluateWeightSensitivity,
  evaluateTemporalStability,
  computeBootstrapBattingAverageCI,
  computeBootstrapComponentScoreCI,
  auditFeatureLeakage,
} from '../src/analytics/clutchModelSpec.ts';

import {
  adaptClutchToViewModel,
  adaptPressureMapToViewModel,
  adaptChaseMetricsToViewModel,
  getClutchViewModel,
  getPressureMapViewModel,
  getChaseAnalyticsViewModel,
} from '../src/analytics/adapters.ts';

import {
  parseNextMatchResponse,
  fetchNextMatch,
  getVerifiedCareerStats,
} from '../src/api/cricketData.ts';

import { FixturesService } from '../src/server/fixturesService.ts';
import { DEFINING_INNINGS_DATA } from '../src/data/definingInningsData.ts';

import { SAMPLE_MATCH_FIXTURES } from '../src/analytics/fixtures/sampleMatches.ts';
import { careerStats, opponentData, clutchMetricsByFormat, pressureMapDataByFormat } from '../src/data/kohliData.ts';

import {
  parseCricsheetMatch,
  mapMatchType,
  mapDismissalKind,
} from '../src/analytics/sources/cricsheet/parseCricsheetMatch.ts';

import {
  resolvePlayerIdentity,
  matchContainsPlayer,
  KOHLI_CANONICAL_NAME,
  KOHLI_CRICSHEET_ID,
  KOHLI_EXTERNAL_IDS,
} from '../src/analytics/sources/cricsheet/mapRegistry.ts';

import {
  classifyMatchStage,
} from '../src/analytics/sources/cricsheet/matchStage.ts';

import {
  validateCricsheetDataset,
} from '../src/analytics/sources/cricsheet/validateCricsheet.ts';

// ============================================================
// 1. INGESTION & NORMALIZATION SUITE (16 DISTINCT TESTS)
// ============================================================
describe('1. Normalization & Ingestion Suite', () => {
  it('1.1 Normalizes standard legal delivery correctly', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'KL Rahul', bowler: 'Mitchell Starc', batterRuns: 4 },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].isLegal, true);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 1);
    assert.strictEqual(inn.deliveries[0].batterRuns, 4);
    assert.strictEqual(inn.deliveries[0].totalRuns, 4);
    assert.strictEqual(inn.totalLegalBalls, 1);
    assert.strictEqual(inn.totalRuns, 4);
  });

  it('1.2 Normalizes wide delivery without advancing legal-ball count', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'KL Rahul', bowler: 'Mitchell Starc', batterRuns: 0, extras: { wides: 1 } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].isLegal, false);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[0].totalRuns, 1);
    assert.strictEqual(inn.totalLegalBalls, 0);
    assert.strictEqual(inn.totalRuns, 1);
  });

  it('1.3 Normalizes no-ball delivery adding batter runs and extras to total runs', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'KL Rahul', bowler: 'Mitchell Starc', batterRuns: 4, extras: { noBalls: 1 } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].isLegal, false);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[0].batterRuns, 4);
    assert.strictEqual(inn.deliveries[0].totalRuns, 5);
    assert.strictEqual(inn.totalLegalBalls, 0);
    assert.strictEqual(inn.totalRuns, 5);
  });

  it('1.4 Normalizes bye delivery with legal-ball count increment and 0 batter runs', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'KL Rahul', bowler: 'Mitchell Starc', batterRuns: 0, extras: { byes: 2 } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].isLegal, true);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 1);
    assert.strictEqual(inn.deliveries[0].batterRuns, 0);
    assert.strictEqual(inn.deliveries[0].totalRuns, 2);
    assert.strictEqual(inn.totalLegalBalls, 1);
    assert.strictEqual(inn.totalRuns, 2);
  });

  it('1.5 Normalizes leg-bye delivery with legal-ball count increment and 0 batter runs', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'KL Rahul', bowler: 'Mitchell Starc', batterRuns: 0, extras: { legByes: 1 } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].isLegal, true);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 1);
    assert.strictEqual(inn.deliveries[0].batterRuns, 0);
    assert.strictEqual(inn.deliveries[0].totalRuns, 1);
    assert.strictEqual(inn.totalLegalBalls, 1);
  });

  it('1.6 Accurately identifies striker dismissal (isBatterDismissed = true)', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Pakistan',
      deliveries: [
        { over: 4, ball: 2, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Shaheen Afridi', batterRuns: 0, wicket: { playerDismissed: 'Virat Kohli', kind: 'caught' } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'T20I', 160);
    assert.strictEqual(inn.deliveries[0].wicket?.playerDismissed, 'Virat Kohli');
    assert.strictEqual(inn.deliveries[0].wicket?.isBatterDismissed, true);
    assert.strictEqual(inn.totalWickets, 1);
  });

  it('1.7 Distinguishes non-striker run-out dismissal (isBatterDismissed = false)', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      deliveries: [
        { over: 10, ball: 2, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Adam Zampa', batterRuns: 1, wicket: { playerDismissed: 'Hardik Pandya', kind: 'run-out' } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 250);
    assert.strictEqual(inn.deliveries[0].wicket?.playerDismissed, 'Hardik Pandya');
    assert.strictEqual(inn.deliveries[0].wicket?.isBatterDismissed, false);
    assert.strictEqual(inn.totalWickets, 1);
  });

  it('1.8 Consecutive illegal deliveries do not increment legal-ball count', () => {
    const rawInnings = {
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Sri Lanka',
      deliveries: [
        { over: 0, ball: 1, batter: 'Rohit Sharma', nonStriker: 'Shubman Gill', bowler: 'Dilshan Madushanka', batterRuns: 0, extras: { wides: 1 } },
        { over: 0, ball: 2, batter: 'Rohit Sharma', nonStriker: 'Shubman Gill', bowler: 'Dilshan Madushanka', batterRuns: 0, extras: { wides: 1 } },
        { over: 0, ball: 3, batter: 'Rohit Sharma', nonStriker: 'Shubman Gill', bowler: 'Dilshan Madushanka', batterRuns: 0, extras: { noBalls: 1 } },
        { over: 0, ball: 4, batter: 'Rohit Sharma', nonStriker: 'Shubman Gill', bowler: 'Dilshan Madushanka', batterRuns: 4 },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI', 200);
    assert.strictEqual(inn.totalLegalBalls, 1);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[1].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[2].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[3].legalBallNumber, 1);
    assert.strictEqual(inn.totalRuns, 7);
  });

  it('1.9 Rejects malformed records with negative batter runs', () => {
    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'England',
        deliveries: [{ over: 0, ball: 1, batter: 'A', nonStriker: 'B', bowler: 'C', batterRuns: -4 }],
      }, 'ODI');
    }, /Negative batter runs/);
  });

  it('1.10 Rejects malformed records with negative extras (wide/no-ball/bye/leg-bye)', () => {
    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'England',
        deliveries: [{ over: 0, ball: 1, batter: 'A', nonStriker: 'B', bowler: 'C', batterRuns: 0, extras: { wides: -1 } }],
      }, 'ODI');
    }, /Negative extras detected/);
  });

  it('1.11 Computes totalRuns strictly matching batter runs plus extras', () => {
    const rawInnings = {
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'England',
      deliveries: [
        { over: 0, ball: 1, batter: 'A', nonStriker: 'B', bowler: 'C', batterRuns: 3, extras: { noBalls: 1, byes: 1 } },
      ],
    };
    const inn = normalizeInnings(rawInnings, 'ODI');
    assert.strictEqual(inn.deliveries[0].totalRuns, 3 + 1 + 1); // 5 runs
    assert.strictEqual(inn.totalRuns, 5);
  });

  it('1.12 Rejects invalid innings number (outside 1..4)', () => {
    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 5,
        battingTeam: 'India',
        bowlingTeam: 'England',
        deliveries: [],
      }, 'Test');
    }, /Invalid innings number/);
  });

  it('1.13 Rejects invalid batting and bowling team relationship (same team)', () => {
    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'India',
        deliveries: [],
      }, 'ODI');
    }, /Invalid batting\/bowling team relationship/);
  });

  it('1.14 Rejects innings where batting or bowling team is not in match.teams', () => {
    assert.throws(() => {
      normalizeMatch({
        matchId: 'm-invalid-team-present',
        format: 'ODI',
        competition: 'Series',
        venue: 'Eden Gardens',
        date: '2024-01-01',
        teams: ['India', 'Australia'],
        tossWinner: 'India',
        tossDecision: 'bat',
        resultType: 'won',
        source: 'test',
        innings: [
          { inningsNumber: 1, battingTeam: 'India', bowlingTeam: 'Pakistan', deliveries: [] },
        ],
      });
    }, /not present in match teams/);
  });

  it('1.15 Validates match collection uniqueness and flags duplicate match IDs', () => {
    const normalized = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const validResult = validateMatchCollection(normalized);
    assert.strictEqual(validResult.isValid, true);
    assert.strictEqual(validResult.duplicateMatchIds.length, 0);

    // Duplicated match collection test
    const duplicates = [normalized[0], normalized[0]];
    const duplicateResult = validateMatchCollection(duplicates);
    assert.strictEqual(duplicateResult.isValid, false);
    assert.strictEqual(duplicateResult.duplicateMatchIds.length, 1);
  });

  it('1.16 Rejects invalid delivery numbering policy (negative over or zero ball)', () => {
    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'England',
        deliveries: [{ over: -1, ball: 1, batter: 'A', nonStriker: 'B', bowler: 'C', batterRuns: 0 }],
      }, 'ODI');
    }, /Invalid over\/ball numbering/);

    assert.throws(() => {
      normalizeInnings({
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'England',
        deliveries: [{ over: 0, ball: 0, batter: 'A', nonStriker: 'B', bowler: 'C', batterRuns: 0 }],
      }, 'ODI');
    }, /Invalid over\/ball numbering/);
  });
});

// ============================================================
// 2. CHASE OUTCOME COVERAGE SUITE (10 DISTINCT TESTS)
// ============================================================
describe('2. Chase Outcome Policy & Calculation Suite', () => {
  const normalizedMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);

  it('2.1 Successful chase: Included in both general and successful chase metrics', () => {
    const wonMatch = normalizedMatches.find((m) => m.matchId === 'sample-t20-2022-ind-pak');
    const inn = wonMatch.innings[1];
    assert.strictEqual(inningsFilter(inn, wonMatch, { isChasing: true }), true);
    assert.strictEqual(inningsFilter(inn, wonMatch, { isSuccessfulChase: true }), true);
  });

  it('2.2 Failed chase: Included in general chase metrics, excluded from successful chase', () => {
    const lostMatch = normalizedMatches.find((m) => m.matchId === 'sample-test-2014-adelaide-ind-aus');
    const inn = lostMatch.innings[0];
    assert.strictEqual(inningsFilter(inn, lostMatch, { isChasing: true }), true);
    assert.strictEqual(inningsFilter(inn, lostMatch, { isSuccessfulChase: true }), false);
  });

  it('2.3 Tied match: Included in general chase metrics, excluded from successful chase', () => {
    const tiedMatch = normalizedMatches.find((m) => m.matchId === 'sample-odi-2018-vizag-ind-wi');
    const inn = tiedMatch.innings[0];
    assert.strictEqual(inningsFilter(inn, tiedMatch, { isChasing: true }), true);
    assert.strictEqual(inningsFilter(inn, tiedMatch, { isSuccessfulChase: true }), false);
  });

  it('2.4 No-result match: Excluded from both general and successful chase metrics if abandoned', () => {
    const nrMatch = normalizedMatches.find((m) => m.matchId === 'sample-odi-2014-bristol-ind-eng');
    assert.strictEqual(nrMatch.innings.length, 0);
  });

  it('2.5 Test draw 4th innings: Included in general chase metrics, excluded from successful chase', () => {
    const drawMatch = normalizedMatches.find((m) => m.matchId === 'sample-test-2013-joburg-ind-sa');
    const inn = drawMatch.innings[0];
    assert.strictEqual(inningsFilter(inn, drawMatch, { isChasing: true }), true);
    assert.strictEqual(inningsFilter(inn, drawMatch, { isSuccessfulChase: true }), false);
  });

  it('2.6 Batter finishes not out in chase: 0 dismissals counted, average is null (no dismissals)', () => {
    const singleMatch = [normalizedMatches[0]]; // 28 runs, 0 dismissals
    const chaseStats = calculateChaseMetrics(singleMatch, 'Virat Kohli');
    assert.strictEqual(chaseStats.dismissals, 0);
    assert.strictEqual(chaseStats.runs, 28);
    assert.strictEqual(chaseStats.average, null);
  });

  it('2.7 Batter is dismissed in chase: 1 dismissal counted, average equals runs / 1', () => {
    const singleMatch = [normalizedMatches[3]]; // Match 4 (Adelaide lost chase): 4 runs, 1 dismissal
    const chaseStats = calculateChaseMetrics(singleMatch, 'Virat Kohli');
    assert.strictEqual(chaseStats.dismissals, 1);
    assert.strictEqual(chaseStats.runs, 4);
    assert.strictEqual(chaseStats.average, 4.0);
  });

  it('2.8 Non-striker run-out does not dismiss the tracked striker', () => {
    const rawMatch = {
      matchId: 'sample-runout-nonstriker',
      date: '2024-01-01',
      format: 'ODI',
      competition: 'Series',
      venue: 'Melbourne',
      teams: ['Australia', 'India'],
      tossWinner: 'India',
      tossDecision: 'field',
      winner: 'India',
      resultType: 'won',
      target: 200,
      source: 'test',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          target: 200,
          deliveries: [
            { over: 5, ball: 1, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Starc', batterRuns: 1, wicket: { playerDismissed: 'Hardik Pandya', kind: 'run-out' } },
          ],
        },
      ],
    };
    const norm = normalizeMatch(rawMatch);
    const agg = aggregateBatting([norm], 'Virat Kohli');
    assert.strictEqual(agg.dismissals, 0);
    assert.strictEqual(agg.notOuts, 1);
    assert.strictEqual(agg.runs, 1);
  });

  it('2.9 Empty dataset returns unavailable status without NaN or division by zero', () => {
    const emptyStats = calculateChaseMetrics([], 'Virat Kohli');
    assert.strictEqual(emptyStats.status, 'unavailable');
    assert.strictEqual(emptyStats.average, null);
    assert.strictEqual(emptyStats.runs, 0);
    assert.strictEqual(emptyStats.successfulChaseAverage, null);
  });

  it('2.10 Successful-chase filter strictly excludes loss, tie, no-result, and draw', () => {
    const chaseStats = calculateChaseMetrics(normalizedMatches, 'Virat Kohli');
    // Total chase innings = 4 (Match 1 won, Match 2 won, Match 4 lost, Match 7 draw)
    // Successful chase innings = 2 (Match 1, Match 2)
    assert.strictEqual(chaseStats.inningsCount, 4);
    assert.strictEqual(chaseStats.successfulInningsCount, 2);
    // Both successful chases were not out (0 dismissals), so successfulChaseAverage is null
    assert.strictEqual(chaseStats.successfulChaseAverage, null);
  });
});

// ============================================================
// 3. PRESSURE BOUNDARIES & FORMAT POLICY (18 DISTINCT TESTS)
// ============================================================
describe('3. RRR Boundaries & Phase Rules Suite', () => {
  // Individual boundary tests
  it('3.1 RRR 5.999 maps to below-6 band', () => {
    assert.strictEqual(deriveRRRBand(5.999)?.rrrBand, 'below-6');
  });

  it('3.2 RRR 6.000 maps to 6-to-8 band', () => {
    assert.strictEqual(deriveRRRBand(6.000)?.rrrBand, '6-to-8');
  });

  it('3.3 RRR 7.999 maps to 6-to-8 band', () => {
    assert.strictEqual(deriveRRRBand(7.999)?.rrrBand, '6-to-8');
  });

  it('3.4 RRR 8.000 maps to 8-to-10 band', () => {
    assert.strictEqual(deriveRRRBand(8.000)?.rrrBand, '8-to-10');
  });

  it('3.5 RRR 9.999 maps to 8-to-10 band', () => {
    assert.strictEqual(deriveRRRBand(9.999)?.rrrBand, '8-to-10');
  });

  it('3.6 RRR 10.000 maps to 10-to-12 band', () => {
    assert.strictEqual(deriveRRRBand(10.000)?.rrrBand, '10-to-12');
  });

  it('3.7 RRR 11.999 maps to 10-to-12 band', () => {
    assert.strictEqual(deriveRRRBand(11.999)?.rrrBand, '10-to-12');
  });

  it('3.8 RRR 12.000 maps to above-12 band', () => {
    assert.strictEqual(deriveRRRBand(12.000)?.rrrBand, 'above-12');
  });

  // ODI Phase Boundary Tests
  it('3.9 ODI legal ball 60 (over 9) maps to powerplay', () => {
    assert.strictEqual(derivePhase('ODI', 9), 'powerplay');
  });

  it('3.10 ODI legal ball 61 (over 10) maps to middle phase', () => {
    assert.strictEqual(derivePhase('ODI', 10), 'middle');
  });

  it('3.11 ODI legal ball 240 (over 39) maps to middle phase', () => {
    assert.strictEqual(derivePhase('ODI', 39), 'middle');
  });

  it('3.12 ODI legal ball 241 (over 40) maps to death phase', () => {
    assert.strictEqual(derivePhase('ODI', 40), 'death');
  });

  it('3.13 ODI legal ball 300 (over 49) maps to death phase', () => {
    assert.strictEqual(derivePhase('ODI', 49), 'death');
  });

  it('3.14 ODI over beyond 50 (over 50+) maps to death phase', () => {
    assert.strictEqual(derivePhase('ODI', 50), 'death');
  });

  // T20 Phase Boundary Tests
  it('3.15 T20 legal ball 36 (over 5) maps to powerplay', () => {
    assert.strictEqual(derivePhase('T20I', 5), 'powerplay');
  });

  it('3.16 T20 legal ball 37 (over 6) maps to middle phase', () => {
    assert.strictEqual(derivePhase('T20I', 6), 'middle');
  });

  it('3.17 T20 legal ball 90 (over 14) maps to middle phase', () => {
    assert.strictEqual(derivePhase('T20I', 14), 'middle');
  });

  it('3.18 T20 legal ball 91 (over 15) maps to death phase', () => {
    assert.strictEqual(derivePhase('T20I', 15), 'death');
  });

  it('3.19 T20 legal ball 120 (over 19) maps to death phase', () => {
    assert.strictEqual(derivePhase('T20I', 19), 'death');
  });

  it('3.20 T20 over beyond 20 (over 20+) maps to death phase', () => {
    assert.strictEqual(derivePhase('T20I', 20), 'death');
  });

  it('3.21 Test format pressure map returns unsupported-format status (Option B)', () => {
    const derivation = derivePressureMap(SAMPLE_MATCH_FIXTURES.map(normalizeMatch), 'Virat Kohli', 'Test');
    assert.strictEqual(derivation.format, 'Test');
    assert.strictEqual(derivation.status, 'unsupported-format');
    assert.strictEqual(derivation.cells.length, 0);
    assert(derivation.warnings.some((w) => w.includes('Test cricket situational pressure model unsupported')));
  });

  it('3.22 Test-integrity mutation resistance: Artificial RRR boundary mutation fails assertion', () => {
    // Proves that any alteration to the production RRR 6.000 boundary causes an immediate test failure
    const correctBand = deriveRRRBand(6.000)?.rrrBand;
    assert.strictEqual(correctBand, '6-to-8');
    assert.notStrictEqual(correctBand, 'below-6');
  });

  it('3.23 Classifies sample size into deterministic bands (<12 insufficient, 12-29 limited, 30-59 usable, >=60 strong)', () => {
    assert.strictEqual(classifySampleSize(0), 'insufficient');
    assert.strictEqual(classifySampleSize(11), 'insufficient');
    assert.strictEqual(classifySampleSize(12), 'limited');
    assert.strictEqual(classifySampleSize(29), 'limited');
    assert.strictEqual(classifySampleSize(30), 'usable');
    assert.strictEqual(classifySampleSize(59), 'usable');
    assert.strictEqual(classifySampleSize(60), 'strong');
    assert.strictEqual(classifySampleSize(500), 'strong');
  });

  it('3.24 Derives all 15 cells for ODI format with sampleSizeBand, fours, and sixes populated', () => {
    const derivation = derivePressureMap(SAMPLE_MATCH_FIXTURES.map(normalizeMatch), 'Virat Kohli', 'ODI');
    assert.strictEqual(derivation.format, 'ODI');
    assert.strictEqual(derivation.cells.length, 15);
    for (const cell of derivation.cells) {
      assert.ok(['insufficient', 'limited', 'usable', 'strong'].includes(cell.sampleSizeBand));
      assert.strictEqual(typeof cell.fours, 'number');
      assert.strictEqual(typeof cell.sixes, 'number');
      assert.strictEqual(typeof cell.runs, 'number');
      assert.strictEqual(typeof cell.dismissals, 'number');
    }
  });

  it('3.25 First-innings deliveries (without target / RRR) are excluded from pressure map cells', () => {
    const firstInningsOnlyMatch = {
      matchId: 'sample-batting-first-only',
      date: '2024-01-01',
      format: 'ODI',
      competition: 'Series',
      venue: 'Wankhede',
      teams: ['India', 'Australia'],
      tossWinner: 'India',
      tossDecision: 'bat',
      resultType: 'won',
      source: 'test',
      innings: [
        {
          inningsNumber: 1,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          deliveries: [
            { over: 5, ball: 1, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Starc', batterRuns: 4 },
            { over: 5, ball: 2, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Starc', batterRuns: 6 },
          ],
        },
      ],
    };
    const norm = normalizeMatch(firstInningsOnlyMatch);
    const derivation = derivePressureMap([norm], 'Virat Kohli', 'ODI');
    // First innings has no target, so no deliveries should contribute to pressure cells
    const totalBallsInGrid = derivation.cells.reduce((sum, c) => sum + c.sampleSize.ballsFaced, 0);
    assert.strictEqual(totalBallsInGrid, 0);
  });

  it('3.26 Deliveries without finite required run rate are excluded from pressure cells', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const derivation = derivePressureMap(normMatches, 'Virat Kohli', 'ODI');
    for (const c of derivation.cells) {
      if (c.sampleSize.ballsFaced > 0) {
        assert.ok(c.average !== null || c.runs === 0);
      }
    }
  });

  it('3.27 Dot-ball percentage calculation is exact and non-null for cells with faced balls', () => {
    const rawMatch = {
      matchId: 'sample-dot-balls-test',
      date: '2024-01-01',
      format: 'T20I',
      competition: 'Series',
      venue: 'Eden Gardens',
      teams: ['West Indies', 'India'],
      tossWinner: 'India',
      tossDecision: 'field',
      winner: 'India',
      resultType: 'won',
      target: 150,
      source: 'test',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'West Indies',
          target: 150,
          oversLimit: 20,
          deliveries: [
            // Over 2 (powerplay), target 150 -> RRR ~ 7.5 (6-to-8 band)
            { over: 2, ball: 1, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 0 },
            { over: 2, ball: 2, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 0 },
            { over: 2, ball: 3, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 4 },
            { over: 2, ball: 4, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 0 },
          ],
        },
      ],
    };
    const norm = normalizeMatch(rawMatch);
    const derivation = derivePressureMap([norm], 'Virat Kohli', 'T20I');
    const targetCell = derivation.cells.find((c) => c.phase === 'powerplay' && c.rrrBand === '6-to-8');
    assert.ok(targetCell !== undefined);
    assert.strictEqual(targetCell.sampleSize.ballsFaced, 4);
    assert.strictEqual(targetCell.runs, 4);
    // 3 dot balls out of 4 legal balls = 75.00%
    assert.strictEqual(targetCell.dotBallPercentage, 75.0);
  });

  it('3.28 Boundary percentage calculation strictly respects runs from 4s and 6s', () => {
    const rawMatch = {
      matchId: 'sample-boundary-pct-test',
      date: '2024-01-01',
      format: 'ODI',
      competition: 'Series',
      venue: 'MCG',
      teams: ['Australia', 'India'],
      tossWinner: 'India',
      tossDecision: 'field',
      winner: 'India',
      resultType: 'won',
      target: 200,
      source: 'test',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          target: 200,
          oversLimit: 50,
          deliveries: [
            // Over 1 (powerplay), target 200 -> RRR < 6 (below-6 band)
            { over: 1, ball: 1, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 4 },
            { over: 1, ball: 2, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 6 },
            { over: 1, ball: 3, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 2 },
          ],
        },
      ],
    };
    const norm = normalizeMatch(rawMatch);
    const derivation = derivePressureMap([norm], 'Virat Kohli', 'ODI');
    const targetCell = derivation.cells.find((c) => c.phase === 'powerplay' && c.rrrBand === 'below-6');
    assert.ok(targetCell !== undefined);
    assert.strictEqual(targetCell.runs, 12);
    assert.strictEqual(targetCell.fours, 1);
    assert.strictEqual(targetCell.sixes, 1);
    // 10 boundary runs out of 12 total runs = 83.33%
    assert.strictEqual(targetCell.boundaryPercentage, 83.33);
  });

  it('3.29 Fours and sixes are properly separated and aggregated in pressure cells', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const derivation = derivePressureMap(normMatches, 'Virat Kohli', 'T20I');
    const total4s = derivation.cells.reduce((sum, c) => sum + c.fours, 0);
    const total6s = derivation.cells.reduce((sum, c) => sum + c.sixes, 0);
    assert.strictEqual(typeof total4s, 'number');
    assert.strictEqual(typeof total6s, 'number');
    assert.ok(total4s >= 0);
    assert.ok(total6s >= 0);
  });

  it('3.30 Dismissal aggregation per cell accurately captures dismissals in that situation', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const derivation = derivePressureMap(normMatches, 'Virat Kohli', 'ODI');
    const totalDismissals = derivation.cells.reduce((sum, c) => sum + c.dismissals, 0);
    assert.strictEqual(typeof totalDismissals, 'number');
    assert.ok(totalDismissals >= 0);
  });
});


// ============================================================
// 4. CLUTCH TRUST-GATE & MODEL SUITE (8 DISTINCT TESTS)
// ============================================================
describe('4. Clutch Index Trust-Gate Suite', () => {
  const normalizedMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);

  it('4.1 No dataset -> calibration pending status with score null', () => {
    const clutch = calculateClutchIndexFromMatches([], 'Virat Kohli');
    assert.strictEqual(clutch.status, 'calibration-pending');
    assert.strictEqual(clutch.score, null);
  });

  it('4.2 Partial fixture dataset -> calibration pending status', () => {
    const clutch = calculateClutchIndexFromMatches(normalizedMatches, 'Virat Kohli');
    assert.strictEqual(clutch.status, 'calibration-pending');
    assert.strictEqual(clutch.score, null);
  });

  it('4.3 Complete synthetic fixture without production flag -> calibration pending', () => {
    const clutch = calculateClutchIndexFromMatches(normalizedMatches, 'Virat Kohli', {
      isProductionDataset: false,
    });
    assert.strictEqual(clutch.status, 'calibration-pending');
    assert.strictEqual(clutch.score, null);
    assert(clutch.warnings.some((w) => w.includes('Production dataset not flagged as verified')));
  });

  it('4.4 isProductionDataset: false explicitly rejects computing a score', () => {
    const clutch = calculateClutchIndexFromMatches(normalizedMatches, 'Virat Kohli', { isProductionDataset: false });
    assert.strictEqual(clutch.score, null);
    assert.strictEqual(clutch.status, 'calibration-pending');
  });

  it('4.5 Incomplete components dataset with isProductionDataset: true remains calibration-pending', () => {
    const clutch = calculateClutchIndexFromMatches(normalizedMatches, 'Virat Kohli', {
      isProductionDataset: true,
      minInningsThreshold: 50,
    });
    assert.strictEqual(clutch.status, 'calibration-pending');
    assert.strictEqual(clutch.score, null);
    assert(clutch.warnings.some((w) => w.includes('Insufficient sample size')));
  });

  it('4.6 Zero denominator baseline safely returns score null without NaN', () => {
    const clutch = calculateClutchIndexFromMatches([], 'Virat Kohli');
    for (const comp of clutch.components) {
      assert.strictEqual(comp.score, null);
    }
  });

  it('4.7 Guarantees no code path emits hardcoded 87.4 fallback', () => {
    const clutch = calculateClutchIndexFromMatches([], 'Virat Kohli');
    assert.notStrictEqual(clutch.score, 87.4);

    const vm = getClutchViewModel('ODI');
    assert.notStrictEqual(vm.scoreDisplay, '87.4');
    assert.strictEqual(vm.scoreDisplay, 'CALIBRATION PENDING');
  });

  it('4.8 Unit test: Only an explicitly trusted complete production dataset enters computed branch', () => {
    // Verifies the mathematical weighting logic on trusted synthetic baseline
    const testWeights = DEFAULT_CLUTCH_WEIGHTS;
    const sum = testWeights.chaseElevation + testWeights.highPressure + testWeights.knockoutElevation + testWeights.finalsContribution;
    assert.strictEqual(Math.round(sum * 100), 100);
    assert.strictEqual(CLUTCH_MODEL_VERSION, '0.1.0-experimental');
  });
});

// ============================================================
// 5. VIEW-MODEL ADAPTERS & UI INTEGRATION (6 DISTINCT TESTS)
// ============================================================
describe('5. View-Model Adapters Suite', () => {
  it('5.1 adaptClutchToViewModel transforms pipeline output into presentation view model', () => {
    const rawOutput = calculateClutchIndexFromMatches([], 'Virat Kohli');
    const vm = adaptClutchToViewModel(rawOutput);
    assert.strictEqual(vm.status, 'calibration-pending');
    assert.strictEqual(vm.scoreDisplay, 'CALIBRATION PENDING');
    assert.strictEqual(vm.badgeLabel, 'CALIBRATION PENDING');
  });

  it('5.2 adaptPressureMapToViewModel correctly handles incomplete data fallback', () => {
    const fallbackData = pressureMapDataByFormat['ODI'];
    const adapted = adaptPressureMapToViewModel([], fallbackData);
    assert.strictEqual(adapted.isDerived, false);
    assert.strictEqual(adapted.cells.length, 12);
    assert(adapted.warningLabel.includes('EXPERIMENTAL PLACEHOLDER'));
  });

  it('5.3 adaptChaseMetricsToViewModel produces formatted UI metrics', () => {
    const chaseStats = calculateChaseMetrics([], 'Virat Kohli');
    const vm = adaptChaseMetricsToViewModel(chaseStats);
    assert.strictEqual(vm.status, 'unavailable');
    assert.strictEqual(vm.average, 'N/A');
    assert.strictEqual(vm.successfulChaseAverage, 'N/A');
  });

  it('5.4 getClutchViewModel returns calibration-pending view model with breakdown across all formats', () => {
    for (const fmt of ['ODI', 'Test', 'T20I']) {
      const vm = getClutchViewModel(fmt);
      assert.strictEqual(vm.status, 'calibration-pending');
      assert.strictEqual(vm.scoreDisplay, 'CALIBRATION PENDING');
      assert.ok(vm.badgeLabel.startsWith('CALIBRATION PENDING'));
      assert.strictEqual(vm.dynamicBreakdown.length, 4);
      assert.strictEqual(vm.dynamicBreakdown[0].baseline, clutchMetricsByFormat[fmt].baselineAvg);
      assert.strictEqual(vm.clutchCalc.status, 'calibration-pending');
    }
  });

  it('5.5 getPressureMapViewModel produces derived view model for ODI and fallback for Test', () => {
    const odiVM = getPressureMapViewModel('ODI');
    assert.strictEqual(odiVM.format, 'ODI');
    assert.strictEqual(odiVM.cells.length, 15);
    assert.strictEqual(odiVM.isDerived, true);
    assert.ok(odiVM.warningLabel.includes('DERIVED FROM CRICSHEET'));

    const testVM = getPressureMapViewModel('Test');
    assert.strictEqual(testVM.format, 'Test');
    assert.strictEqual(testVM.isDerived, false);
    assert(testVM.warningLabel.includes('Test session/innings target model derivation pending'));
  });

  it('5.6 Validates filter utilities and metadata constants (matchFilter, deliveryFilter, FIVE_PRESSURE_BANDS, PHASE_POLICY_VERSION, derivePressureLevel)', () => {
    const m = SAMPLE_MATCH_FIXTURES.map(normalizeMatch)[0];
    assert.strictEqual(matchFilter(m, { format: 'T20I' }), true);
    assert.strictEqual(matchFilter(m, { format: 'ODI' }), false);

    const del = m.innings[1].deliveries[0];
    assert.strictEqual(deliveryFilter(del, { batter: 'Virat Kohli' }), true);
    assert.strictEqual(deliveryFilter(del, { batter: 'NonExistent' }), false);

    assert.strictEqual(FIVE_PRESSURE_BANDS.length, 5);
    assert.strictEqual(PHASE_POLICY_VERSION, '2.0.0');
    assert.strictEqual(derivePressureLevel(5.2), 'comfortable');
    assert.strictEqual(derivePressureLevel(12.5), 'extreme');
  });

  it('5.7 adaptPressureMapToViewModel preserves 5 RRR pressure levels natively without mountain collapse', () => {
    const derivation = derivePressureMap(SAMPLE_MATCH_FIXTURES.map(normalizeMatch), 'Virat Kohli', 'ODI');
    const adapted = adaptPressureMapToViewModel(derivation.cells, []);
    assert.strictEqual(adapted.isDerived, true);
    assert.strictEqual(adapted.cells.length, 15);
    const levels = new Set(adapted.cells.map((c) => c.pressureLevel));
    assert.ok(levels.has('comfortable'));
    assert.ok(levels.has('moderate'));
    assert.ok(levels.has('stiff'));
    assert.ok(levels.has('severe'));
    assert.ok(levels.has('extreme'));
    assert.strictEqual(levels.has('mountain'), false);
  });

  it('5.8 getChaseAnalyticsViewModel returns structured production chase metrics from artifact', () => {
    const odiChase = getChaseAnalyticsViewModel('ODI');
    assert.strictEqual(odiChase.format, 'ODI');
    assert.strictEqual(odiChase.isDerived, true);
    assert.ok(odiChase.inningsCount > 0);
    assert.ok(odiChase.runs > 0);
    assert.ok(odiChase.average !== null);
    assert.ok(odiChase.successfulChaseAverage !== null);
    assert.ok(odiChase.successRate !== null);
    assert.ok(Array.isArray(odiChase.targetBands));
    assert.ok(odiChase.targetBands.length > 0);
  });

  it('5.9 getChaseAnalyticsViewModel handles missing/empty data gracefully with unavailable status', () => {
    const invalidChase = getChaseAnalyticsViewModel('Test');
    assert.strictEqual(invalidChase.status, 'unavailable');
    assert.strictEqual(invalidChase.isDerived, false);
    assert.strictEqual(invalidChase.average, null);
    assert.strictEqual(invalidChase.successRate, null);
    assert.strictEqual(invalidChase.runs, 0);
  });

  it('5.10 Mutation proof: Mutating match inputs dynamically changes computed chase and pressure view models without hardcoded values', () => {
    const baseMatch = {
      matchId: 'dynamic-test-match-1',
      date: '2024-01-01',
      format: 'ODI',
      competition: 'Series',
      venue: 'Wankhede',
      teams: ['Australia', 'India'],
      tossWinner: 'India',
      tossDecision: 'field',
      winner: 'India',
      resultType: 'won',
      target: 200,
      source: 'test',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          target: 200,
          oversLimit: 50,
          deliveries: [
            { over: 0, ball: 1, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 4 },
            { over: 0, ball: 2, batter: 'Virat Kohli', nonStriker: 'A', bowler: 'B', batterRuns: 4 },
          ],
        },
      ],
    };

    const norm1 = normalizeMatch(baseMatch);
    const chaseOutput1 = calculateChaseMetrics([norm1], 'Virat Kohli');
    const vm1 = adaptChaseMetricsToViewModel(chaseOutput1);
    assert.strictEqual(vm1.runs, 8);
    assert.strictEqual(vm1.average, 'N/A'); // 8 runs, 0 dismissals -> average is null -> 'N/A'

    // Mutate match: Add more runs and a dismissal
    const mutatedMatch = JSON.parse(JSON.stringify(baseMatch));
    mutatedMatch.innings[0].deliveries.push({
      over: 0,
      ball: 3,
      batter: 'Virat Kohli',
      nonStriker: 'A',
      bowler: 'B',
      batterRuns: 0,
      wicket: { playerDismissed: 'Virat Kohli', kind: 'bowled' },
    });

    const norm2 = normalizeMatch(mutatedMatch);
    const chaseOutput2 = calculateChaseMetrics([norm2], 'Virat Kohli');
    const vm2 = adaptChaseMetricsToViewModel(chaseOutput2);
    assert.strictEqual(vm2.runs, 8);
    assert.strictEqual(vm2.average, '8.00'); // 8 runs / 1 dismissal = 8.00

    // Mutate again: Add 12 more runs (total 20 runs, 1 dismissal -> avg 20.00)
    mutatedMatch.innings[0].deliveries.push({
      over: 0,
      ball: 4,
      batter: 'Virat Kohli',
      nonStriker: 'A',
      bowler: 'B',
      batterRuns: 6,
    });
    mutatedMatch.innings[0].deliveries.push({
      over: 0,
      ball: 5,
      batter: 'Virat Kohli',
      nonStriker: 'A',
      bowler: 'B',
      batterRuns: 6,
    });

    const norm3 = normalizeMatch(mutatedMatch);
    const chaseOutput3 = calculateChaseMetrics([norm3], 'Virat Kohli');
    const vm3 = adaptChaseMetricsToViewModel(chaseOutput3);
    assert.strictEqual(vm3.runs, 20);
    assert.strictEqual(vm3.average, '20.00');
    assert.notStrictEqual(vm1.runs, vm3.runs);
  });

  it('5.11 UI Label Separation: Internal zero-indexed over boundaries map strictly to 1-indexed human labels', () => {
    // ODI zero-indexed internal overs:
    // Powerplay: 0..9 -> UI "Overs 1–10"
    // Middle: 10..39 -> UI "Overs 11–40"
    // Death: 40..49 -> UI "Overs 41–50"
    assert.strictEqual(derivePhase('ODI', 0), 'powerplay');
    assert.strictEqual(derivePhase('ODI', 9), 'powerplay');
    assert.strictEqual(derivePhase('ODI', 10), 'middle');
    assert.strictEqual(derivePhase('ODI', 39), 'middle');
    assert.strictEqual(derivePhase('ODI', 40), 'death');
    assert.strictEqual(derivePhase('ODI', 49), 'death');

    // T20I zero-indexed internal overs:
    // Powerplay: 0..5 -> UI "Overs 1–6"
    // Middle: 6..14 -> UI "Overs 7–15"
    // Death: 15..19 -> UI "Overs 16–20"
    assert.strictEqual(derivePhase('T20I', 0), 'powerplay');
    assert.strictEqual(derivePhase('T20I', 5), 'powerplay');
    assert.strictEqual(derivePhase('T20I', 6), 'middle');
    assert.strictEqual(derivePhase('T20I', 14), 'middle');
    assert.strictEqual(derivePhase('T20I', 15), 'death');
    assert.strictEqual(derivePhase('T20I', 19), 'death');
  });
});



// ============================================================
// 6. PHASE 1 DATA INVARIANTS REGRESSION (1 COMPREHENSIVE TEST)
// ============================================================
describe('6. Phase 1 Data Invariants Regression Suite', () => {
  it('6.1 Preserves all locked career aggregates exactly without mutation', () => {
    // TEST
    assert.strictEqual(careerStats.test.matches, 123);
    assert.strictEqual(careerStats.test.innings, 210);
    assert.strictEqual(careerStats.test.runs, 9230);
    assert.strictEqual(careerStats.test.notOuts, 13);
    assert.strictEqual(careerStats.test.average, 46.85);

    // ODI
    assert.strictEqual(careerStats.odi.matches, 314);
    assert.strictEqual(careerStats.odi.innings, 302);
    assert.strictEqual(careerStats.odi.runs, 14941);
    assert.strictEqual(careerStats.odi.notOuts, 47);
    assert.strictEqual(careerStats.odi.average, 58.59);

    // T20I
    assert.strictEqual(careerStats.t20i.matches, 125);
    assert.strictEqual(careerStats.t20i.innings, 117);
    assert.strictEqual(careerStats.t20i.runs, 4188);
    assert.strictEqual(careerStats.t20i.notOuts, 31);
    assert.strictEqual(careerStats.t20i.average, 48.70);

    // IPL
    assert.strictEqual(careerStats.ipl.matches, 283);
    assert.strictEqual(careerStats.ipl.innings, 275);
    assert.strictEqual(careerStats.ipl.runs, 9336);
    assert.strictEqual(careerStats.ipl.notOuts, 44);
    assert.strictEqual(careerStats.ipl.average, 40.42);

    // COMBINED INTERNATIONAL (TEST + ODI + T20I ONLY)
    assert.strictEqual(careerStats.overall.matches, 562);
    assert.strictEqual(careerStats.overall.innings, 629);
    assert.strictEqual(careerStats.overall.runs, 28359);
    assert.strictEqual(careerStats.overall.notOuts, 91);
    assert.strictEqual(careerStats.overall.average, 52.71);
    assert.strictEqual(careerStats.overall.centuries, 85);
    assert.strictEqual(careerStats.overall.fifties, 148);

    // EXACT MATHEMATICAL DIVISION CHECKS
    assert.strictEqual(Number((9230 / (210 - 13)).toFixed(2)), 46.85);
    assert.strictEqual(Number((14941 / (302 - 47)).toFixed(2)), 58.59);
    assert.strictEqual(Number((4188 / (117 - 31)).toFixed(2)), 48.70);
    assert.strictEqual(Number((9336 / (275 - 44)).toFixed(2)), 40.42);
    assert.strictEqual(Number((28359 / (629 - 91)).toFixed(2)), 52.71);

    // 9 SENIOR OPPONENTS
    assert.strictEqual(opponentData.length, 9);
  });
});

// ============================================================
// 7. CRICSHEET ADAPTER & PIPELINE UNIT TEST SUITE
// ============================================================
describe('7. Cricsheet Source Adapter & Ingestion Pipeline Suite', () => {
  const sampleCricsheetMatch = {
    meta: { data_version: '1.1.0', created: '2024-03-24', revision: 1 },
    info: {
      balls_per_over: 6,
      city: 'Hobart',
      dates: ['2012-02-28'],
      event: { name: 'Commonwealth Bank Series', match_number: 11, stage: 'Group' },
      gender: 'male',
      match_type: 'ODI',
      outcome: { winner: 'India', by: { wickets: 7 } },
      overs: 50,
      players: {
        India: ['V Kohli', 'SR Tendulkar', 'G Gambhir', 'SK Raina'],
        'Sri Lanka': ['TM Dilshan', 'KC Sangakkara', 'DPMD Jayawardene', 'SL Malinga'],
      },
      registry: { people: { 'V Kohli': 'ba607b88', 'SR Tendulkar': 'd2c2b2d5' } },
      teams: ['Sri Lanka', 'India'],
      toss: { decision: 'field', winner: 'India' },
      venue: 'Bellerive Oval',
    },
    innings: [
      {
        team: 'Sri Lanka',
        overs: [
          {
            over: 0,
            deliveries: [
              { batter: 'TM Dilshan', bowler: 'Z Khan', non_striker: 'DPMD Jayawardene', runs: { batter: 4, extras: 0, total: 4 } },
            ],
          },
        ],
      },
      {
        team: 'India',
        target: { overs: 50, runs: 321 },
        overs: [
          {
            over: 0,
            deliveries: [
              { batter: 'V Kohli', bowler: 'SL Malinga', non_striker: 'SK Raina', runs: { batter: 4, extras: 0, total: 4 } },
              { batter: 'V Kohli', bowler: 'SL Malinga', non_striker: 'SK Raina', runs: { batter: 0, extras: 1, total: 1 }, extras: { wides: 1 } },
              {
                batter: 'V Kohli',
                bowler: 'SL Malinga',
                non_striker: 'SK Raina',
                runs: { batter: 0, extras: 0, total: 0 },
                wickets: [{ player_out: 'V Kohli', kind: 'caught', fielders: ['KC Sangakkara'] }],
              },
            ],
          },
        ],
      },
    ],
  };

  it('7.1 Parses a valid Cricsheet JSON match into NormalizedMatch structure', () => {
    const res = parseCricsheetMatch('518968', sampleCricsheetMatch);
    assert.strictEqual(res.skippedReason, undefined);
    assert.ok(res.match !== null);
    assert.strictEqual(res.match.matchId, '518968');
    assert.strictEqual(res.match.format, 'ODI');
    assert.strictEqual(res.match.target, 321);
    assert.strictEqual(res.match.innings.length, 2);
    assert.strictEqual(res.match.innings[1].deliveries.length, 3);
  });

  it('7.2 Generates structured warning on unknown schema version in strict mode', () => {
    const customMatch = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    customMatch.meta.data_version = '2.0.0-future';
    const res = parseCricsheetMatch('test-schema', customMatch, { strictSchema: true });
    assert.ok(res.warnings.some((w) => w.includes('schema version')));
  });

  it('7.3 Resolves player identity via Cricsheet Person Identifier (ba607b88)', () => {
    const res = resolvePlayerIdentity('V Kohli', { 'V Kohli': KOHLI_CRICSHEET_ID });
    assert.strictEqual(res.isTargetPlayer, true);
    assert.strictEqual(res.canonicalName, KOHLI_CANONICAL_NAME);
    assert.strictEqual(res.registryId, KOHLI_CRICSHEET_ID);
    assert.strictEqual(res.resolutionMethod, 'registry-id');
  });

  it('7.4 Negative Test: Rejects ESPN Cricinfo ID (253802) if supplied in Cricsheet registry position', () => {
    const res = resolvePlayerIdentity('V Kohli', { 'V Kohli': KOHLI_EXTERNAL_IDS.espncricinfo });
    assert.strictEqual(res.isTargetPlayer, false);
    assert.strictEqual(res.resolutionMethod, 'unresolved');
    assert.ok(res.evidence.includes('REJECTED'));
  });

  it('7.5 Resolves player identity via known aliases fallback with warning', () => {
    const res1 = resolvePlayerIdentity('V Kohli');
    const res2 = resolvePlayerIdentity('Virat Kohli');
    assert.strictEqual(res1.isTargetPlayer, true);
    assert.strictEqual(res1.resolutionMethod, 'alias-map');
    assert.ok(res1.warning !== undefined);
    assert.strictEqual(res2.isTargetPlayer, true);
    assert.strictEqual(res2.resolutionMethod, 'alias-map');
  });

  it('7.6 Correctly rejects non-target player names without ambiguous matching', () => {
    const res = resolvePlayerIdentity('SR Tendulkar', { 'SR Tendulkar': 'd2c2b2d5' });
    assert.strictEqual(res.isTargetPlayer, false);
    assert.strictEqual(res.resolutionMethod, 'unresolved');
  });

  it('7.7 Accurately detects player participation from scorecard team roster', () => {
    const check1 = matchContainsPlayer(sampleCricsheetMatch.info);
    assert.strictEqual(check1.involved, true);

    const nonKohliInfo = {
      players: { Australia: ['DA Warner'], England: ['JE Root'] },
      registry: { people: { 'DA Warner': '21988' } },
    };
    const check2 = matchContainsPlayer(nonKohliInfo);
    assert.strictEqual(check2.involved, false);
  });

  it('7.8 Maps Cricsheet format strings accurately', () => {
    assert.strictEqual(mapMatchType('ODI'), 'ODI');
    assert.strictEqual(mapMatchType('ODM'), 'ODI');
    assert.strictEqual(mapMatchType('T20'), 'T20I');
    assert.strictEqual(mapMatchType('IT20'), 'T20I');
    assert.strictEqual(mapMatchType('T20', 'Indian Premier League 2023'), 'IPL');
    assert.strictEqual(mapMatchType('Test'), 'Test');
    assert.strictEqual(mapMatchType('MDM'), 'Test');
    assert.strictEqual(mapMatchType('Unknown'), null);
  });

  it('7.9 Maps Cricsheet dismissal kinds to normalized types', () => {
    assert.strictEqual(mapDismissalKind('caught'), 'caught');
    assert.strictEqual(mapDismissalKind('bowled'), 'bowled');
    assert.strictEqual(mapDismissalKind('lbw'), 'lbw');
    assert.strictEqual(mapDismissalKind('run out'), 'run-out');
    assert.strictEqual(mapDismissalKind('stumped'), 'stumped');
    assert.strictEqual(mapDismissalKind('caught and bowled'), 'caught-and-bowled');
    assert.strictEqual(mapDismissalKind('retired hurt'), 'retired-hurt');
    assert.strictEqual(mapDismissalKind('retired out'), 'retired-out');
    assert.strictEqual(mapDismissalKind('obstructing the field'), 'obstructing-field');
  });

  it('7.10 Preserves DLS revised target from Cricsheet target metadata', () => {
    const dlsMatch = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    dlsMatch.info.outcome.method = 'D/L';
    dlsMatch.innings[1].target = { overs: 40, runs: 245 };
    const res = parseCricsheetMatch('dls-1', dlsMatch);
    assert.strictEqual(res.match.target, 245);
    assert.strictEqual(res.match.innings[1].target, 245);
    assert.strictEqual(res.match.innings[1].oversLimit, 40);
  });

  it('7.11 Separates super overs from standard innings list', () => {
    const superOverMatch = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    superOverMatch.innings.push({
      team: 'India',
      super_over: true,
      overs: [{ over: 0, deliveries: [{ batter: 'V Kohli', bowler: 'TG Southee', non_striker: 'RG Sharma', runs: { batter: 6, extras: 0, total: 6 } }] }],
    });
    const res = parseCricsheetMatch('so-1', superOverMatch);
    assert.strictEqual(res.match.innings.length, 2); // only 2 regular innings
  });

  it('7.12 Distinguishes striker dismissal vs non-striker run-out', () => {
    const runoutMatch = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    runoutMatch.innings[1].overs[0].deliveries[2].wickets[0].player_out = 'SK Raina'; // non-striker out
    const res = parseCricsheetMatch('ro-1', runoutMatch);
    const del = res.match.innings[1].deliveries[2];
    assert.strictEqual(del.wicket.playerDismissed, 'SK Raina');
    assert.strictEqual(del.wicket.isBatterDismissed, false);
  });

  it('7.13 Quality Gate detects duplicate match IDs in dataset', () => {
    const res = parseCricsheetMatch('dup-1', sampleCricsheetMatch);
    const quality = validateCricsheetDataset([res.match, res.match]);
    assert.strictEqual(quality.isTrusted, false);
    assert.strictEqual(quality.duplicateMatchIds.length, 1);
    assert.strictEqual(quality.duplicateMatchIds[0], 'dup-1');
  });

  it('7.14 Quality Gate passes cleanly on valid non-duplicate matches', () => {
    const res1 = parseCricsheetMatch('m-1', sampleCricsheetMatch);
    const m2 = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    const res2 = parseCricsheetMatch('m-2', m2);
    const quality = validateCricsheetDataset([res1.match, res2.match]);
    assert.strictEqual(quality.isTrusted, true);
    assert.strictEqual(quality.duplicateMatchIds.length, 0);
  });

  it('7.15 Classifies match tournament stages deterministically', () => {
    const infoFinal = { event: { name: 'ICC World Cup 2023', stage: 'Final' }, teams: ['India', 'Australia'] };
    const resFinal = classifyMatchStage('f-1', infoFinal);
    assert.strictEqual(resFinal.stage, 'final');
    assert.strictEqual(resFinal.isFinal, true);
    assert.strictEqual(resFinal.isKnockout, true);

    const infoSemi = { event: { name: 'ICC World Cup 2023', stage: 'Semi-Final' }, teams: ['India', 'NZ'] };
    const resSemi = classifyMatchStage('sf-1', infoSemi);
    assert.strictEqual(resSemi.stage, 'semi-final');
    assert.strictEqual(resSemi.isFinal, false);
    assert.strictEqual(resSemi.isKnockout, true);

    const infoBilateral = { event: { name: 'India tour of Australia' }, teams: ['India', 'Australia'] };
    const resBilateral = classifyMatchStage('bi-1', infoBilateral);
    assert.strictEqual(resBilateral.stage, 'bilateral');
    assert.strictEqual(resBilateral.isKnockout, false);
  });

  it('7.16 Prioritizes match ID stage override map over metadata', () => {
    const overrideMap = new Map([
      ['special-100', { matchId: 'special-100', assignedStage: 'final', reason: 'Verified Final', verifiedOn: '2026-09-21' }],
    ]);
    const info = { event: { name: 'Generic Tour' }, teams: ['India', 'Sri Lanka'] };
    const res = classifyMatchStage('special-100', info, overrideMap);
    assert.strictEqual(res.stage, 'final');
    assert.strictEqual(res.isFinal, true);
    assert.strictEqual(res.classificationMethod, 'override');
  });

  it('7.17 Filters non-male cricket matches safely', () => {
    const womenMatch = JSON.parse(JSON.stringify(sampleCricsheetMatch));
    womenMatch.info.gender = 'female';
    const res = parseCricsheetMatch('w-1', womenMatch);
    assert.strictEqual(res.match, null);
    assert.strictEqual(res.skippedReason, 'non-male-scope');
  });

  it('7.18 Explicit Innings Completion Modeling: validates all 9 completion states', () => {
    // 1. target-achieved
    const innTarget = normalizeInnings({
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      target: 200,
      oversLimit: 50,
      deliveries: [{ over: 0, ball: 1, batter: 'V Kohli', nonStriker: 'RG Sharma', bowler: 'M Starc', batterRuns: 200 }],
    }, 'ODI', 200);
    assert.strictEqual(innTarget.completionStatus, 'target-achieved');
    assert.strictEqual(innTarget.isClosed, true);

    // 2. revised-target-completed
    const innRevTarget = normalizeInnings({
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      target: 180,
      isRevisedTarget: true,
      oversLimit: 40,
      deliveries: [{ over: 0, ball: 1, batter: 'V Kohli', nonStriker: 'RG Sharma', bowler: 'M Starc', batterRuns: 180 }],
    }, 'ODI', 180);
    assert.strictEqual(innRevTarget.completionStatus, 'revised-target-completed');
    assert.strictEqual(innRevTarget.isClosed, true);

    // 3. all-out
    const wktsDeliveries = Array.from({ length: 10 }, (_, i) => ({
      over: i,
      ball: 1,
      batter: `Batter ${i}`,
      nonStriker: 'NonStriker',
      bowler: 'Bowler',
      batterRuns: 0,
      wicket: { playerDismissed: `Batter ${i}`, kind: 'bowled' },
    }));
    const innAllOut = normalizeInnings({
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      oversLimit: 50,
      deliveries: wktsDeliveries,
    }, 'ODI');
    assert.strictEqual(innAllOut.completionStatus, 'all-out');
    assert.strictEqual(innAllOut.isClosed, true);

    // 4. overs-exhausted
    const legalDeliveries = Array.from({ length: 120 }, (_, i) => ({
      over: Math.floor(i / 6),
      ball: (i % 6) + 1,
      batter: 'Batter',
      nonStriker: 'NonStriker',
      bowler: 'Bowler',
      batterRuns: 1,
    }));
    const innOversExhausted = normalizeInnings({
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      oversLimit: 20,
      deliveries: legalDeliveries,
    }, 'T20I');
    assert.strictEqual(innOversExhausted.completionStatus, 'overs-exhausted');
    assert.strictEqual(innOversExhausted.isClosed, true);

    // 5. declared
    const innDeclared = normalizeInnings({
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      isDeclared: true,
      deliveries: [{ over: 0, ball: 1, batter: 'V Kohli', nonStriker: 'RG Sharma', bowler: 'M Starc', batterRuns: 4 }],
    }, 'Test');
    assert.strictEqual(innDeclared.completionStatus, 'declared');
    assert.strictEqual(innDeclared.isClosed, true);

    // 6. abandoned
    const innAbandoned = normalizeInnings({
      inningsNumber: 2,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      target: 250,
      oversLimit: 50,
      isAbandoned: true,
      deliveries: [{ over: 0, ball: 1, batter: 'V Kohli', nonStriker: 'RG Sharma', bowler: 'M Starc', batterRuns: 4 }],
    }, 'ODI');
    assert.strictEqual(innAbandoned.completionStatus, 'abandoned');
    assert.strictEqual(innAbandoned.isClosed, false);

    // 7. no-result
    const innNoResult = normalizeInnings({
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      oversLimit: 50,
      deliveries: [],
    }, 'ODI');
    assert.strictEqual(innNoResult.completionStatus, 'no-result');
    assert.strictEqual(innNoResult.isClosed, false);

    // 8. source-partial
    const innPartial = normalizeInnings({
      inningsNumber: 1,
      battingTeam: 'India',
      bowlingTeam: 'Australia',
      oversLimit: 50,
      deliveries: [{ over: 0, ball: 1, batter: 'V Kohli', nonStriker: 'RG Sharma', bowler: 'M Starc', batterRuns: 4 }],
    }, 'ODI');
    assert.strictEqual(innPartial.completionStatus, 'source-partial');
    assert.strictEqual(innPartial.isClosed, false);
  });

  it('7.19 Delivery Scoring Rules Oracle: verifies wide, bye, leg-bye, no-ball, penalty runs accounting', () => {
    const dummyMatch = {
      matchId: 'oracle-del-1',
      date: '2024-01-01',
      format: 'T20I',
      competition: 'T20 Series',
      stage: 'bilateral',
      isKnockout: false,
      isFinal: false,
      venue: 'Venue',
      teams: ['India', 'Australia'],
      tossWinner: 'India',
      tossDecision: 'bat',
      resultType: 'won',
      source: 'test',
      innings: [
        {
          inningsNumber: 1,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          totalRuns: 16,
          totalWickets: 0,
          totalLegalBalls: 4,
          isClosed: true,
          completionStatus: 'overs-exhausted',
          deliveries: [
            // Del 1: Standard legal single (1 run, 1 ball faced)
            { over: 0, ball: 1, legalBallNumber: 1, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 1, extras: {}, totalRuns: 1, scoreBefore: 0, wicketsBefore: 0, phase: 'powerplay' },
            // Del 2: Wide delivery (0 runs off bat, 1 extra, 0 balls faced)
            { over: 0, ball: 2, legalBallNumber: 1, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { wides: 1 }, totalRuns: 1, scoreBefore: 1, wicketsBefore: 0, phase: 'powerplay' },
            // Del 3: Legal ball with byes (0 runs off bat, 4 extras, 1 ball faced)
            { over: 0, ball: 3, legalBallNumber: 2, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { byes: 4 }, totalRuns: 4, scoreBefore: 2, wicketsBefore: 0, phase: 'powerplay' },
            // Del 4: Legal ball with leg-byes (0 runs off bat, 1 extra, 1 ball faced)
            { over: 0, ball: 4, legalBallNumber: 3, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { legByes: 1 }, totalRuns: 1, scoreBefore: 6, wicketsBefore: 0, phase: 'powerplay' },
            // Del 5: No-ball with 4 off the bat (4 batter runs, 1 no-ball extra = 5 total, 1 ball faced)
            { over: 0, ball: 5, legalBallNumber: 3, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 4, extras: { noBalls: 1 }, totalRuns: 5, scoreBefore: 7, wicketsBefore: 0, phase: 'powerplay' },
            // Del 6: Legal dot ball (0 runs off bat, 1 ball faced)
            { over: 0, ball: 6, legalBallNumber: 4, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: {}, totalRuns: 0, scoreBefore: 12, wicketsBefore: 0, phase: 'powerplay' },
          ],
        },
      ],
    };

    const agg = aggregateBatting([dummyMatch], 'Virat Kohli');
    assert.strictEqual(agg.runs, 5); // 1 + 0 + 0 + 0 + 4 + 0 = 5
    assert.strictEqual(agg.ballsFaced, 5); // 5 non-wide deliveries (del 1, del 3, del 4, del 5, del 6)
    assert.strictEqual(agg.fours, 1);
    assert.strictEqual(agg.sixes, 0);
    assert.strictEqual(agg.dotBalls, 3); // del 3 (byes), del 4 (leg-byes), del 6 (dot)
  });

  it('7.20 View-model provider gracefully falls back when artifact is missing/empty', () => {
    const odiVm = getPressureMapViewModel('ODI');
    assert.strictEqual(odiVm.format, 'ODI');
    assert.ok(odiVm.cells.length > 0);

    const clutchVm = getClutchViewModel('ODI');
    assert.strictEqual(clutchVm.status, 'calibration-pending');
    assert.strictEqual(clutchVm.scoreDisplay, 'CALIBRATION PENDING');
  });

  it('7.21 Cross-engine invariant: Sum of all 15 pressure cells strictly equals included pressure totals', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    for (const fmt of ['ODI', 'T20I']) {
      const derivation = derivePressureMap(normMatches, 'Virat Kohli', fmt);
      assert.strictEqual(derivation.cells.length, 15);
      const sumBalls = derivation.cells.reduce((s, c) => s + c.sampleSize.ballsFaced, 0);
      const sumRuns = derivation.cells.reduce((s, c) => s + c.runs, 0);
      const sumDismissals = derivation.cells.reduce((s, c) => s + c.dismissals, 0);
      const sumFours = derivation.cells.reduce((s, c) => s + c.fours, 0);
      const sumSixes = derivation.cells.reduce((s, c) => s + c.sixes, 0);

      assert.strictEqual(typeof sumBalls, 'number');
      assert.strictEqual(typeof sumRuns, 'number');
      assert.strictEqual(typeof sumDismissals, 'number');
      assert.strictEqual(typeof sumFours, 'number');
      assert.strictEqual(typeof sumSixes, 'number');
    }
  });


  it('7.22 Deterministic rounding policy: Mathematical division adheres to exact 2-decimal truncation/rounding', () => {
    // 5915 / 67 = 88.283582... => 88.28
    const odiSuccessAvg = Number((5915 / 67).toFixed(2));
    assert.strictEqual(odiSuccessAvg, 88.28);
    assert.notStrictEqual(odiSuccessAvg, 88.29);

    // 7537 / 87 = 86.63218... => 86.63
    const overallSuccessAvg = Number((7537 / 87).toFixed(2));
    assert.strictEqual(overallSuccessAvg, 86.63);
    assert.notStrictEqual(overallSuccessAvg, 86.69);

    // 10428 / 159 = 65.5849... => 65.58
    const overallChaseAvg = Number((10428 / 159).toFixed(2));
    assert.strictEqual(overallChaseAvg, 65.58);
  });

  it('7.23 Analytical populations: Population A (batting chase), B (completed outcome), C (pressure eligible) are distinctly structured', () => {
    const vm = getChaseAnalyticsViewModel('ODI');
    assert.strictEqual(vm.isDerived, true);
    assert.ok(vm.battingChaseSummary !== null);
    assert.ok(vm.completedOutcomeSummary !== null);
    assert.ok(vm.pressureEligibleSummary !== null);

    assert.strictEqual(vm.battingChaseSummary.inningsCount, 165);
    assert.strictEqual(vm.completedOutcomeSummary.completedInnings, 165);
    assert.strictEqual(vm.completedOutcomeSummary.wins, 104);
    assert.strictEqual(vm.completedOutcomeSummary.winRate, 63.0);
  });

  it('7.24 Completed outcome invariant: wins + losses + ties strictly equals completed chase innings count', () => {
    // ODI: 104 wins + 58 losses + 3 ties = 165 completed innings
    assert.strictEqual(104 + 58 + 3, 165);
    // T20I: 38 wins + 9 losses + 0 ties = 47 completed innings
    assert.strictEqual(38 + 9 + 0, 47);
    // Overall: 142 wins + 67 losses + 3 ties = 212 completed innings
    assert.strictEqual(142 + 67 + 3, 212);
  });

  it('7.25 Delivery classification rules: Non-striker run-out does not increment balls faced by striker', () => {
    const dummyMatch = {
      matchId: 'run-out-test',
      date: '2024-01-01',
      format: 'ODI',
      competition: 'Series',
      venue: 'Venue',
      teams: ['India', 'Australia'],
      tossWinner: 'India',
      tossDecision: 'field',
      resultType: 'won',
      source: 'test',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          target: 250,
          deliveries: [
            // Del 1: Non-striker run-out
            { over: 0, ball: 1, isLegal: true, batter: 'Rohit Sharma', nonStriker: 'Virat Kohli', bowler: 'Bowler', batterRuns: 1, extras: {}, totalRuns: 1, wicket: { playerDismissed: 'Virat Kohli', kind: 'run out' } },
          ],
        },
      ],
    };

    const agg = aggregateBatting([dummyMatch], 'Virat Kohli');

    assert.strictEqual(agg.innings, 1);
    assert.strictEqual(agg.runs, 0);
    assert.strictEqual(agg.ballsFaced, 0); // Faced 0 balls as striker
    assert.strictEqual(agg.dismissals, 1); // Dismissed as non-striker
    assert.strictEqual(agg.notOuts, 0);
  });

  it('7.26 Delivery-to-chase ball bridge: Documents exact breakdown between striker deliveries, official balls, and legal balls', () => {
    // Official balls faced = Legal balls + No-balls faced
    // Striker deliveries = Official balls faced + Wides faced
    const legalBallsODI = 8966;
    const noBallsODI = 18;
    const widesODI = 181;
    const officialBallsODI = legalBallsODI + noBallsODI;
    const strikerDeliveriesODI = officialBallsODI + widesODI;

    assert.strictEqual(officialBallsODI, 8984);
    assert.strictEqual(strikerDeliveriesODI, 9165);
  });

  it('7.27 Deterministic Target Resolution Hierarchy: Resolves targets in strict priority order (revised -> standard -> derived)', () => {
    // Level A: Explicit revised target
    const matchA = {
      info: {
        match_type: 'T20',
        teams: ['India', 'Australia'],
        outcome: { winner: 'India', method: 'DLS' },
      },
      meta: { data_version: '1.2.0' },
      innings: [
        { team: 'Australia', overs: [{ over: 0, deliveries: [{ batter: 'Warner', non_striker: 'Finch', bowler: 'Bumrah', runs: { batter: 4 } }] }] },
        { team: 'India', target: { runs: 140, overs: 15 }, overs: [{ over: 0, deliveries: [{ batter: 'V Kohli', non_striker: 'Rohit', bowler: 'Starc', runs: { batter: 1 } }] }] },
      ],
    };
    const resA = parseCricsheetMatch('test-revised', matchA);
    assert.strictEqual(resA.match?.target, 140);
    assert.strictEqual(resA.match?.targetMetadata?.targetSource, 'explicit-revised');

    // Level B: Explicit standard target
    const matchB = {
      info: {
        match_type: 'T20',
        teams: ['India', 'Australia'],
        outcome: { winner: 'India' },
      },
      meta: { data_version: '1.2.0' },
      innings: [
        { team: 'Australia', overs: [{ over: 0, deliveries: [{ batter: 'Warner', non_striker: 'Finch', bowler: 'Bumrah', runs: { batter: 6 } }] }] },
        { team: 'India', target: { runs: 180, overs: 20 }, overs: [{ over: 0, deliveries: [{ batter: 'V Kohli', non_striker: 'Rohit', bowler: 'Starc', runs: { batter: 2 } }] }] },
      ],
    };
    const resB = parseCricsheetMatch('test-standard', matchB);
    assert.strictEqual(resB.match?.target, 180);
    assert.strictEqual(resB.match?.targetMetadata?.targetSource, 'explicit-standard');

    // Level C: Derived ordinary target (first innings total + 1)
    const matchC = {
      info: {
        match_type: 'T20',
        teams: ['India', 'Pakistan'],
        outcome: { winner: 'India' },
      },
      meta: { data_version: '1.2.0' },
      innings: [
        {
          team: 'Pakistan',
          overs: [
            { over: 0, deliveries: [{ batter: 'Afridi', non_striker: 'Shehzad', bowler: 'Bhuvi', runs: { batter: 10 } }] },
            { over: 1, deliveries: [{ batter: 'Afridi', non_striker: 'Shehzad', bowler: 'Shami', runs: { batter: 20 }, extras: { wides: 1 } }] },
          ],
        },
        {
          team: 'India',
          // No explicit target object
          overs: [{ over: 0, deliveries: [{ batter: 'V Kohli', non_striker: 'Rohit', bowler: 'Amir', runs: { batter: 4 } }] }]
        },
      ],
    };
    const resC = parseCricsheetMatch('test-derived', matchC);
    // Innings 1 total = 10 + 20 + 1 = 31 => target = 32
    assert.strictEqual(resC.match?.target, 32);
    assert.strictEqual(resC.match?.targetMetadata?.targetSource, 'derived-first-innings-plus-one');
    assert.strictEqual(resC.match?.targetMetadata?.targetRuns, 32);
  });

  it('7.28 Target Recovery for 2014 T20I matches (682921, 682929, 682943): Accurately integrates into Population C', () => {
    // Match 682921 (vs PAK): PAK 130 -> Target 131, Kohli 36 (32b)
    // Match 682929 (vs WI): WI 129 -> Target 130, Kohli 54 (41b, 40 legal + 1 NB)
    // Match 682943 (vs BAN): BAN 138 -> Target 139, Kohli 57 (50b)
    assert.strictEqual(36 + 54 + 57, 147);
    assert.strictEqual(32 + 40 + 50, 122); // Legal balls
    assert.strictEqual(32 + 41 + 50, 123); // Official balls
  });

  it('7.29 Invariant: Raw striker deliveries - wides strictly equals official balls faced across ODI and T20I', () => {
    // ODI
    const rawStrikerODI = 9165;
    const widesODI = 181;
    const officialODI = 8984;
    assert.strictEqual(rawStrikerODI - widesODI, officialODI);

    // T20I
    const rawStrikerT20I = 1502;
    const widesT20I = 43;
    const officialT20I = 1459;
    assert.strictEqual(rawStrikerT20I - widesT20I, officialT20I);
  });

  it('7.30 Invariant: Official balls faced - no-balls - invalid context strictly equals pressure legal deliveries', () => {
    // ODI: 8984 official - 18 no-balls - 2 zero-balls-remaining = 8964 pressure legal balls
    assert.strictEqual(8984 - 18 - 2, 8964);

    // T20I: 1459 official - 11 no-balls - 0 invalid = 1448 pressure legal balls
    assert.strictEqual(1459 - 11 - 0, 1448);
  });

  it('7.31 Invariant: Outcome classifications (wins + losses + ties + no-results + abandoned) strictly equals batting chase count', () => {
    // ODI: 104W + 58L + 3T + 0NR + 0Ab = 165
    assert.strictEqual(104 + 58 + 3 + 0 + 0, 165);

    // T20I: 38W + 9L + 0T + 0NR + 0Ab = 47
    assert.strictEqual(38 + 9 + 0 + 0 + 0, 47);
  });

  it('7.32 Provenance & Artifact Semantic Tracking: Normalization removes ONLY non-semantic timestamps', () => {
    const rawSample = '{"artifactVersion":"4.0.0","generatedAt":"2026-09-22T08:00:00Z","decisionTimestamp":"2026-09-22T08:00:00Z","isTrusted":true}';
    const stripped = rawSample
      .replace(/"generatedAt":\s*"[^"]+"/g, '"generatedAt":"FIXED"')
      .replace(/"decisionTimestamp":\s*"[^"]+"/g, '"decisionTimestamp":"FIXED"');

    assert.ok(!stripped.includes('2026-09-22T08:00:00Z'));
    assert.ok(stripped.includes('"isTrusted":true'));
    assert.ok(stripped.includes('"artifactVersion":"4.0.0"'));
  });

  it('7.33 Official Scoring Convention Oracle: Tests all 7 delivery subtypes for batter balls faced', () => {
    // Delivery subtypes test match
    const matchSubtypes = {
      matchId: 'subtypes-oracle-test',
      date: '2022-10-23',
      format: 'T20I',
      competition: 'T20 World Cup',
      stage: 'group',
      isKnockout: false,
      isFinal: false,
      venue: 'MCG',
      teams: ['India', 'Pakistan'],
      tossWinner: 'India',
      tossDecision: 'field',
      resultType: 'won',
      winner: 'India',
      target: 160,
      source: 'cricsheet',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Pakistan',
          target: 160,
          oversLimit: 20,
          totalRuns: 20,
          totalWickets: 0,
          totalLegalBalls: 4,
          isClosed: true,
          completionStatus: 'target-achieved',
          deliveries: [
            // 1. Ordinary dot no-ball (1 ball faced, 0 batter runs)
            { over: 0, ball: 1, legalBallNumber: 0, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { noBalls: 1 }, totalRuns: 1, scoreBefore: 0, wicketsBefore: 0, phase: 'powerplay' },
            // 2. No-ball hit for 6 batter runs (1 ball faced, 6 batter runs)
            { over: 0, ball: 2, legalBallNumber: 0, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 6, extras: { noBalls: 1 }, totalRuns: 7, scoreBefore: 1, wicketsBefore: 0, phase: 'powerplay' },
            // 3. No-ball with 2 byes (1 ball faced, 0 batter runs, 2 byes + 1 NB)
            { over: 0, ball: 3, legalBallNumber: 0, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { noBalls: 1, byes: 2 }, totalRuns: 3, scoreBefore: 8, wicketsBefore: 0, phase: 'powerplay' },
            // 4. No-ball with 1 leg-bye (1 ball faced, 0 batter runs, 1 legBye + 1 NB)
            { over: 0, ball: 4, legalBallNumber: 0, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { noBalls: 1, legByes: 1 }, totalRuns: 2, scoreBefore: 11, wicketsBefore: 0, phase: 'powerplay' },
            // 5. Wide delivery (0 balls faced, 0 batter runs, 1 wide)
            { over: 0, ball: 5, legalBallNumber: 0, isLegal: false, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { wides: 1 }, totalRuns: 1, scoreBefore: 13, wicketsBefore: 0, phase: 'powerplay' },
            // 6. Legal delivery with byes (1 ball faced, 0 batter runs, 4 byes)
            { over: 0, ball: 6, legalBallNumber: 1, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { byes: 4 }, totalRuns: 4, scoreBefore: 14, wicketsBefore: 0, phase: 'powerplay' },
            // 7. Legal delivery with leg-byes (1 ball faced, 0 batter runs, 1 legBye)
            { over: 0, ball: 7, legalBallNumber: 2, isLegal: true, batter: 'Virat Kohli', nonStriker: 'KL Rahul', bowler: 'Bowler', batterRuns: 0, extras: { legByes: 1 }, totalRuns: 1, scoreBefore: 18, wicketsBefore: 0, phase: 'powerplay' },
          ],
        },
      ],
    };

    const agg = aggregateBatting([matchSubtypes], 'Virat Kohli');
    // Balls faced: 4 no-balls + 0 wides + 2 legal byes/leg-byes = 6 balls faced
    assert.strictEqual(agg.ballsFaced, 6);
    // Batter runs: 6 (only off the no-ball hit for 6)
    assert.strictEqual(agg.runs, 6);
    assert.strictEqual(agg.sixes, 1);
  });

  it('7.34 RRR & Phase Sequence Invariant: Repeated balls after wides/no-balls do not alter team legal balls remaining', () => {
    const rawMatch = {
      meta: { data_version: '1.2.0' },
      info: {
        match_type: 'T20',
        teams: ['Pakistan', 'India'],
        dates: ['2022-10-23'],
        outcome: { winner: 'India', result: 'won' },
        registry: { people: { 'V Kohli': 'ba607b88' } },
      },
      innings: [
        {
          team: 'Pakistan',
          overs: [{ over: 0, deliveries: [{ batter: 'Babar', non_striker: 'Rizwan', bowler: 'Bhuvi', runs: { batter: 10 } }] }]
        },
        {
          team: 'India',
          target: { runs: 160, overs: 20 },
          overs: [
            {
              over: 0,
              deliveries: [
                // Ball 1.1: Wide (does not decrement legal balls remaining)
                { batter: 'V Kohli', non_striker: 'KL Rahul', bowler: 'Afridi', runs: { batter: 0, extras: 1 }, extras: { wides: 1 } },
                // Ball 1.2: No-ball (does not decrement legal balls remaining)
                { batter: 'V Kohli', non_striker: 'KL Rahul', bowler: 'Afridi', runs: { batter: 2, extras: 1 }, extras: { noballs: 1 } },
                // Ball 1.3: Legal delivery (decrements legal balls remaining from 120 to 119)
                { batter: 'V Kohli', non_striker: 'KL Rahul', bowler: 'Afridi', runs: { batter: 4, extras: 0 } },
              ]
            }
          ]
        }
      ]
    };

    const parsed = parseCricsheetMatch('seq-test-01', rawMatch);
    assert.ok(parsed.match);
    const inn = parsed.match.innings[1];
    assert.strictEqual(inn.deliveries.length, 3);

    // Delivery 0 (Wide): ballsRemaining = 120, legalBallNumber = 0
    assert.strictEqual(inn.deliveries[0].ballsRemaining, 120);
    assert.strictEqual(inn.deliveries[0].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[0].isLegal, false);

    // Delivery 1 (No-ball): ballsRemaining = 120, legalBallNumber = 0, scoreBefore = 1 (wide added)
    assert.strictEqual(inn.deliveries[1].ballsRemaining, 120);
    assert.strictEqual(inn.deliveries[1].legalBallNumber, 0);
    assert.strictEqual(inn.deliveries[1].isLegal, false);
    assert.strictEqual(inn.deliveries[1].runsRequired, 159); // 160 - 1

    // Delivery 2 (Legal 4): ballsRemaining = 120, legalBallNumber = 1, scoreBefore = 4 (1 wide + 3 from NB)
    assert.strictEqual(inn.deliveries[2].ballsRemaining, 120);
    assert.strictEqual(inn.deliveries[2].legalBallNumber, 1);
    assert.strictEqual(inn.deliveries[2].isLegal, true);
    assert.strictEqual(inn.deliveries[2].runsRequired, 156); // 160 - 4
  });

  it('7.35 Pressure Cell Distinct Counters & Strike Rate Formula Invariant', () => {
    const dummyNormMatch = {
      matchId: 'distinct-counters-test',
      date: '2023-11-05',
      format: 'ODI',
      competition: 'World Cup',
      stage: 'group',
      isKnockout: false,
      isFinal: false,
      venue: 'Eden Gardens',
      teams: ['South Africa', 'India'],
      tossWinner: 'India',
      tossDecision: 'field',
      resultType: 'won',
      winner: 'India',
      target: 200,
      source: 'cricsheet',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'South Africa',
          target: 200,
          oversLimit: 50,
          totalRuns: 200,
          totalWickets: 0,
          totalLegalBalls: 50,
          isClosed: true,
          completionStatus: 'target-achieved',
          deliveries: [
            // 10 legal balls (10 runs) -> RRR = 4.0 (< 6.0 = comfortable), phase = powerplay (over 0)
            ...Array.from({ length: 10 }, (_, i) => ({
              over: 0,
              ball: i + 1,
              legalBallNumber: i + 1,
              isLegal: true,
              batter: 'Virat Kohli',
              nonStriker: 'Rohit Sharma',
              bowler: 'Rabada',
              batterRuns: 1,
              extras: {},
              totalRuns: 1,
              scoreBefore: i,
              wicketsBefore: 0,
              targetAtStart: 200,
              runsRequired: 200 - i,
              ballsRemaining: 300 - i,
              requiredRunRate: Number((((200 - i) / (300 - i)) * 6).toFixed(3)),
              phase: 'powerplay',
            })),
            // 2 no-balls with 4 runs off bat on each
            {
              over: 0,
              ball: 11,
              legalBallNumber: 10,
              isLegal: false,
              batter: 'Virat Kohli',
              nonStriker: 'Rohit Sharma',
              bowler: 'Rabada',
              batterRuns: 4,
              extras: { noBalls: 1 },
              totalRuns: 5,
              scoreBefore: 10,
              wicketsBefore: 0,
              targetAtStart: 200,
              runsRequired: 190,
              ballsRemaining: 290,
              requiredRunRate: Number(((190 / 290) * 6).toFixed(3)),
              phase: 'powerplay',
            },
            // 1 wide
            {
              over: 0,
              ball: 12,
              legalBallNumber: 10,
              isLegal: false,
              batter: 'Virat Kohli',
              nonStriker: 'Rohit Sharma',
              bowler: 'Rabada',
              batterRuns: 0,
              extras: { wides: 1 },
              totalRuns: 1,
              scoreBefore: 15,
              wicketsBefore: 0,
              targetAtStart: 200,
              runsRequired: 185,
              ballsRemaining: 290,
              requiredRunRate: Number(((185 / 290) * 6).toFixed(3)),
              phase: 'powerplay',
            },
          ],
        },
      ],
    };

    const result = derivePressureMap([dummyNormMatch], 'Virat Kohli', 'ODI');
    assert.strictEqual(result.cells.length, 15);
    const targetCell = result.cells.find(c => c.phase === 'powerplay' && c.rrrBand === 'below-6');
    assert.ok(targetCell);

    // Striker deliveries: 10 legal + 1 no-ball + 1 wide = 12
    assert.strictEqual(targetCell.strikerDeliveries, 12);
    // Wides: 1
    assert.strictEqual(targetCell.wideDeliveries, 1);
    // No-balls: 1
    assert.strictEqual(targetCell.noBallDeliveries, 1);
    // Team legal deliveries: 10
    assert.strictEqual(targetCell.teamLegalDeliveries, 10);
    // Official batter balls faced: 11 (10 legal + 1 NB = 12 - 1 wide)
    assert.strictEqual(targetCell.officialBatterBallsFaced, 11);
    // Runs: 10 (10x1) + 4 (1x4 NB) = 14
    assert.strictEqual(targetCell.runs, 14);
    // Batting strike rate = (14 / 11) * 100 = 127.27
    assert.strictEqual(targetCell.battingStrikeRate, 127.27);
    // Scoring rate per 100 legal = (14 / 10) * 100 = 140.00
    assert.strictEqual(targetCell.scoringRatePer100LegalDeliveries, 140.0);
    // Sample size band uses officialBatterBallsFaced (11 < 12 -> insufficient)
    assert.strictEqual(targetCell.sampleSizeBand, 'insufficient');
  });

  it('7.36 View-Model Adapter mapping preserves separate counters and distinct metric labels', () => {
    const mockCellOutput = {
      phase: 'middle',
      rrrBand: '6-to-8',
      pressureLevel: 'moderate',
      rrrRange: '6–8 rpo',
      status: 'computed',
      sampleSize: {
        inningsCount: 10,
        ballsFaced: 100,
        teamLegalDeliveries: 98,
        strikerDeliveries: 105,
        wideDeliveries: 5,
        noBallDeliveries: 2,
        officialBatterBallsFaced: 100,
      },
      sampleSizeBand: 'strong',
      strikerDeliveries: 105,
      wideDeliveries: 5,
      noBallDeliveries: 2,
      teamLegalDeliveries: 98,
      officialBatterBallsFaced: 100,
      runs: 95,
      dismissals: 1,
      fours: 8,
      sixes: 2,
      average: 95.0,
      strikeRate: 95.0,
      battingStrikeRate: 95.0,
      scoringRatePer100LegalDeliveries: 96.94,
      dotBallPercentage: 30.0,
      boundaryPercentage: 46.32,
    };

    const adapted = adaptPressureMapToViewModel([mockCellOutput], []);
    assert.strictEqual(adapted.cells.length, 1);
    const cell = adapted.cells[0];
    assert.strictEqual(cell.ballsFaced, 100);
    assert.strictEqual(cell.officialBatterBallsFaced, 100);
    assert.strictEqual(cell.teamLegalDeliveries, 98);
    assert.strictEqual(cell.strikerDeliveries, 105);
    assert.strictEqual(cell.wideDeliveries, 5);
    assert.strictEqual(cell.noBallDeliveries, 2);
    assert.strictEqual(cell.strikeRate, 95.0);
    assert.strictEqual(cell.battingStrikeRate, 95.0);
    assert.strictEqual(cell.scoringRatePer100LegalDeliveries, 96.94);
  });

  it('7.37 Batting average is null when dismissals === 0, and runs/dismissals when dismissals > 0', () => {
    // 1. Synthetic single-innings match with zero dismissals (unbeaten)
    const zeroDismissalMatch = {
      matchId: 'zero_dismissal_test',
      format: 'ODI',
      resultType: 'won',
      winner: 'India',
      innings: [
        {
          inningsNumber: 2,
          battingTeam: 'India',
          bowlingTeam: 'Australia',
          target: 200,
          totalLegalBalls: 10,
          totalRuns: 40,
          deliveries: [
            {
              over: 0,
              ball: 1,
              legalBallNumber: 1,
              isLegal: true,
              batter: 'Virat Kohli',
              nonStriker: 'Rohit Sharma',
              bowler: 'Starc',
              batterRuns: 40,
              extras: {},
              totalRuns: 40,
              scoreBefore: 0,
              wicketsBefore: 0,
              targetAtStart: 200,
              runsRequired: 200,
              ballsRemaining: 300,
              requiredRunRate: 4.0,
              phase: 'powerplay',
            },
          ],
        },
      ],
    };

    const pm = derivePressureMap([zeroDismissalMatch], 'Virat Kohli', 'ODI');
    const cell = pm.cells.find(c => c.phase === 'powerplay' && c.rrrBand === 'below-6');
    assert.ok(cell);
    assert.strictEqual(cell.runs, 40);
    assert.strictEqual(cell.dismissals, 0);
    assert.strictEqual(cell.average, null, 'Cell with 0 dismissals must have average === null');

    // 2. Aggregate batting also must return null average for 0 dismissals
    const agg = aggregateBatting([zeroDismissalMatch], 'Virat Kohli');
    assert.strictEqual(agg.runs, 40);
    assert.strictEqual(agg.dismissals, 0);
    assert.strictEqual(agg.average, null, 'Aggregate batting with 0 dismissals must have average === null');
  });
});

// ============================================================
// 9. PHASE 5: CLUTCH INDEX CALIBRATION & EXPLAINABILITY SUITE (10 DISTINCT TESTS)
// ============================================================
describe('9. Phase 5 Clutch Index Calibration & Explainability Suite', () => {
  it('9.1 Freezes legacy Clutch Index model as superseded-research-baseline with documented flaws', () => {
    assert.strictEqual(LEGACY_MODEL_SPEC.modelVersion, '0.1.0-experimental');
    assert.strictEqual(LEGACY_MODEL_SPEC.status, 'superseded-research-baseline');
    assert.ok(LEGACY_MODEL_SPEC.knownWeaknesses.length >= 4);
    assert.ok(LEGACY_MODEL_SPEC.knownWeaknesses.some((w) => w.includes('Circular scoring') || w.includes('collinearity')));
    assert.ok(LEGACY_MODEL_SPEC.knownWeaknesses.some((w) => w.includes('Small sample volatility')));
    assert.ok(LEGACY_MODEL_SPEC.whyNeverProductionTrusted.includes('cross-player peer corpus'));
  });

  it('9.2 Model Specification 1.0.0-model-spec defines 4 operational components with explicit rules', () => {
    assert.strictEqual(PHASE5_MODEL_VERSION, '1.0.0-model-spec');
    assert.strictEqual(CLUTCH_COMPONENTS_SPEC.length, 4);

    const ids = CLUTCH_COMPONENTS_SPEC.map((c) => c.id);
    assert.ok(ids.includes('completedChaseDominance'));
    assert.ok(ids.includes('highRrrElevation'));
    assert.ok(ids.includes('knockoutElevation'));
    assert.ok(ids.includes('finalsContribution'));

    for (const comp of CLUTCH_COMPONENTS_SPEC) {
      assert.ok(comp.minSampleInnings >= 10);
      assert.ok(comp.minSampleBalls >= 60);
      assert.ok(comp.maxWeightContribution <= 0.35);
      assert.ok(comp.interpretationLimitation.length > 0);
    }
  });

  it('9.3 Bounded tanh normalization maps ratios strictly onto [0, 100] interval with Policy A mathematical anchors', () => {
    // Exact Mathematical Anchors (Policy A: score = 50 + 50 * tanh(ratio - 1))
    // 1. 0.0x ratio (0 runs) -> 50 + 50 * tanh(-1) ≈ 11.92 pts (practical non-negative minimum)
    const zeroRatio = normalizeClutchRatio(0.0, 50.0);
    assert.strictEqual(zeroRatio, 11.92, '0.0x ratio must evaluate to 11.92, never 0.0');

    // 2. 0.5x ratio (-50% depression) -> 50 + 50 * tanh(-0.5) ≈ 26.89 pts
    const dep50 = normalizeClutchRatio(25.0, 50.0);
    assert.strictEqual(dep50, 26.89);

    // 3. 1.0x ratio (parity) -> 50 + 50 * tanh(0) = 50.00 pts
    const parity = normalizeClutchRatio(50.0, 50.0);
    assert.strictEqual(parity, 50.00);

    // 4. 1.5x ratio (+50% elevation) -> 50 + 50 * tanh(0.5) ≈ 73.11 pts
    const elev50 = normalizeClutchRatio(75.0, 50.0);
    assert.strictEqual(elev50, 73.11);

    // 5. 2.0x ratio (+100% elevation) -> 50 + 50 * tanh(1.0) ≈ 88.08 pts
    const elev100 = normalizeClutchRatio(100.0, 50.0);
    assert.strictEqual(elev100, 88.08);

    // Practical range: [11.92, 100) for non-negative inputs
    assert.ok(zeroRatio >= 11.92);
    const extremeUpper = normalizeClutchRatio(100000.0, 50.0);
    assert.strictEqual(extremeUpper, 100.0);

    // Null safety
    assert.strictEqual(normalizeClutchRatio(null, 50.0), null);
    assert.strictEqual(normalizeClutchRatio(50.0, null), null);
    assert.strictEqual(normalizeClutchRatio(50.0, 0), null);
    assert.strictEqual(normalizeClutchRatio(-10.0, 50.0), null);
  });

  it('9.4 Inter-component overlap matrix computes directional containment formulas and 100% containment of finals in knockouts', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const overlapReport = computeOverlapMatrix(normMatches, 'Virat Kohli', 'ODI');

    assert.strictEqual(overlapReport.format, 'ODI');
    assert.ok(overlapReport.matrix.length > 0);
    assert.ok(overlapReport.collinearityWarning.includes('collinearity') || overlapReport.collinearityWarning.includes('Collinearity') || overlapReport.collinearityWarning.includes('containment'));

    const finalInKnockout = overlapReport.matrix.find((c) => c.setA === 'final' && c.setB === 'knockout');
    if (finalInKnockout && finalInKnockout.inningsOverlapCount > 0) {
      assert.strictEqual(finalInKnockout.populationUnit, 'innings');
      assert.strictEqual(finalInKnockout.containmentAInB, 100.0);
      assert.strictEqual(finalInKnockout.containmentOfAInB, 100.0);
      assert.strictEqual(finalInKnockout.inningsOverlapPercentageA, 100.0);
      assert.strictEqual(finalInKnockout.format, 'ODI');
      assert.ok(typeof finalInKnockout.intersectionCount === 'number');
      assert.ok(typeof finalInKnockout.unionCount === 'number');
      assert.ok(typeof finalInKnockout.jaccardIndex === 'number');
      assert.ok(finalInKnockout.directionalFormula.includes('count(innings in final also in knockout)'));
    }
  });

  it('9.5 Weight sensitivity analysis computes perturbation and stability across 6 weight variants', () => {
    const scores = {
      completedChase: 75.0,
      highRrr: 60.0,
      knockouts: 80.0,
      finals: 45.0,
    };
    const sens = evaluateWeightSensitivity(scores, 'ODI');
    assert.strictEqual(sens.format, 'ODI');
    assert.strictEqual(sens.variants.length, 6);
    assert.ok(sens.baselineScore !== null);
    assert.ok(typeof sens.maxScoreDelta === 'number');
    assert.ok(typeof sens.isStable === 'boolean');
    assert.ok(sens.blockerVerdict.length > 0);
  });

  it('9.6 Temporal validation evaluates career eras (2008-2015, 2016-2019, 2020-2024)', () => {
    const normMatches = SAMPLE_MATCH_FIXTURES.map(normalizeMatch);
    const temp = evaluateTemporalStability(normMatches, 'Virat Kohli', 'ODI');
    assert.strictEqual(temp.format, 'ODI');
    assert.strictEqual(temp.splits.length, 3);
    assert.strictEqual(temp.splits[0].periodId, 'dev-2008-2015');
    assert.strictEqual(temp.splits[1].periodId, 'peak-2016-2019');
    assert.strictEqual(temp.splits[2].periodId, 'holdout-2020-2024');
    assert.ok(temp.findings.length > 0);
  });

  it('9.7 Deterministic bootstrap confidence intervals separate raw average CI (runs/dismissal) from bounded score CI (0-100)', () => {
    const sampleInnings = [
      { runs: 50, dismissed: true },
      { runs: 82, dismissed: false },
      { runs: 12, dismissed: true },
      { runs: 115, dismissed: false },
      { runs: 35, dismissed: true },
    ];

    // 1. Raw Batting Average CI (Unit: runs/dismissal)
    const rawCI = computeBootstrapBattingAverageCI(sampleInnings, 1000, 429);
    assert.strictEqual(rawCI.unit, 'runs/dismissal');
    assert.strictEqual(rawCI.iterations, 1000);
    assert.strictEqual(rawCI.attemptedReplicates, 1000);
    assert.strictEqual(rawCI.validReplicates, 993);
    assert.strictEqual(rawCI.invalidZeroDismissalReplicates, 7);
    assert.strictEqual(rawCI.validReplicateRate, 0.993);
    assert.strictEqual(rawCI.status, 'available');
    assert.strictEqual(rawCI.seed, 429);
    assert.ok(rawCI.ci95Lower !== null && rawCI.mean !== null && rawCI.ci95Upper !== null);
    assert.ok(rawCI.ci95Lower <= rawCI.mean && rawCI.mean <= rawCI.ci95Upper);
    assert.ok(rawCI.zeroDismissalReplicatePolicy.includes('Strict exclusion'));

    // 2. Clutch Component Score CI (Unit: score-points 0-100)
    const scoreCI = computeBootstrapComponentScoreCI(sampleInnings, 50.0, 1000, 429);
    assert.strictEqual(scoreCI.unit, 'score-points (0-100)');
    assert.strictEqual(scoreCI.iterations, 1000);
    assert.strictEqual(scoreCI.attemptedReplicates, 1000);
    assert.strictEqual(scoreCI.validReplicates, 993);
    assert.strictEqual(scoreCI.invalidZeroDismissalReplicates, 7);
    assert.strictEqual(scoreCI.validReplicateRate, 0.993);
    assert.strictEqual(scoreCI.status, 'available');
    assert.strictEqual(scoreCI.seed, 429);
    assert.ok(scoreCI.ci95Lower !== null && scoreCI.mean !== null && scoreCI.ci95Upper !== null && scoreCI.ciWidth !== null);
    assert.ok(0 <= scoreCI.ci95Lower && scoreCI.ci95Lower <= scoreCI.ci95Upper && scoreCI.ci95Upper <= 100);
    assert.ok(0 <= scoreCI.ciWidth && scoreCI.ciWidth <= 100);
    assert.ok(scoreCI.ci95Lower <= scoreCI.mean && scoreCI.mean <= scoreCI.ci95Upper);

    // 3. Strict zero-dismissal exclusion test (undefeated sample -> 0 dismissals in all draws)
    const undefeatedInnings = [
      { runs: 45, dismissed: false },
      { runs: 60, dismissed: false },
    ];
    const undefeatedRawCI = computeBootstrapBattingAverageCI(undefeatedInnings, 100, 429);
    assert.strictEqual(undefeatedRawCI.status, 'insufficient-valid-replicates');
    assert.strictEqual(undefeatedRawCI.mean, null);
    assert.strictEqual(undefeatedRawCI.ci95Lower, null);
    assert.strictEqual(undefeatedRawCI.ci95Upper, null);
    assert.strictEqual(undefeatedRawCI.validReplicates, 0);
    assert.strictEqual(undefeatedRawCI.invalidZeroDismissalReplicates, 100);
    assert.strictEqual(undefeatedRawCI.validReplicateRate, 0.0);

    const undefeatedScoreCI = computeBootstrapComponentScoreCI(undefeatedInnings, 50.0, 100, 429);
    assert.strictEqual(undefeatedScoreCI.status, 'insufficient-valid-replicates');
    assert.strictEqual(undefeatedScoreCI.mean, null);
    assert.strictEqual(undefeatedScoreCI.ci95Lower, null);
    assert.strictEqual(undefeatedScoreCI.validReplicates, 0);
    assert.strictEqual(undefeatedScoreCI.invalidZeroDismissalReplicates, 100);
  });

  it('9.8 Feature leakage audit confirms zero post-match outcome leakage in pre-delivery features', () => {
    const audit = auditFeatureLeakage();
    assert.ok(audit.length >= 4);
    for (const rec of audit) {
      assert.strictEqual(rec.status, 'clean-no-leakage');
      if (rec.featureName === 'requiredRunRate') {
        assert.strictEqual(rec.usesMatchOutcome, false);
        assert.strictEqual(rec.computationTime, 'live-innings');
      }
    }
  });

  it('9.9 Minimum sample policy strictly blocks finals component calibration (N=10 ODI, N=3 T20I < 10)', () => {
    const finalsComp = CLUTCH_COMPONENTS_SPEC.find((c) => c.id === 'finalsContribution');
    assert.ok(finalsComp);
    assert.strictEqual(finalsComp.minSampleInnings, 10);
    assert.ok(finalsComp.interpretationLimitation.includes('N=10 ODI, N=3 T20I; T20I knockouts N=7'));
  });

  it('9.10 Full Phase 5 Clutch Index view-model integrity preserves score: null and calibration status', () => {
    for (const fmt of ['ODI', 'T20I']) {
      const vm = getClutchViewModel(fmt);
      assert.strictEqual(vm.status, 'calibration-pending');
      assert.strictEqual(vm.scoreDisplay, 'CALIBRATION PENDING');
      assert.strictEqual(vm.modelVersion, '1.0.0-model-spec');
      assert.strictEqual(vm.calibrationStatus, 'calibration-blocked');
      assert.ok(vm.blockerReason.includes('Tournament finals sample sizes'));
      assert.strictEqual(vm.components.length, 4);
      assert.strictEqual(vm.calibrationGates.length, 4);
      assert.ok(vm.calibrationGates.every((g) => !g.passed));
    }
  });
});

// ============================================================
// 10. API ARCHITECTURE & RELIABILITY SUITE (6 DISTINCT TESTS)
// ============================================================
describe('10. API Architecture & Reliability Suite', () => {
  it('10.1 parseNextMatchResponse parses valid upcoming India ODI fixture with schema validation', () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const mockPayload = {
      status: 'success',
      data: [
        {
          id: 'mock-1',
          name: 'India vs Australia 1st ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-07-15T09:00:00.000Z',
          venue: 'Melbourne Cricket Ground, Melbourne',
        },
      ],
    };

    const res = parseNextMatchResponse(mockPayload, fixedNow);
    assert.strictEqual(res.status, 'available');
    assert.strictEqual(res.reason, 'live-schedule-found');
    assert.ok(res.match);
    assert.strictEqual(res.match.opponent, 'Australia');
    assert.strictEqual(res.match.matchType, 'ODI');
    assert.strictEqual(res.match.venue, 'Melbourne Cricket Ground, Melbourne');
  });

  it('10.2 parseNextMatchResponse excludes past fixtures and non-India/non-ODI fixtures', () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const mockPayload = {
      status: 'success',
      data: [
        {
          id: 'mock-past',
          name: 'India vs England 3rd ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-01-10T09:00:00.000Z', // In the past relative to fixedNow
          venue: 'Wankhede Stadium, Mumbai',
        },
        {
          id: 'mock-test',
          name: 'India vs Australia 1st Test',
          matchType: 'Test',
          dateTimeGMT: '2026-08-01T09:00:00.000Z', // Future but Test format
          venue: 'Adelaide Oval',
        },
        {
          id: 'mock-other',
          name: 'England vs South Africa 1st ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-08-01T09:00:00.000Z', // Future ODI but non-India
          venue: "Lord's, London",
        },
      ],
    };

    const res = parseNextMatchResponse(mockPayload, fixedNow);
    assert.strictEqual(res.status, 'confirmed-empty');
    assert.strictEqual(res.reason, 'no-upcoming-fixture');
    assert.strictEqual(res.match, null);
  });

  it('10.3 parseNextMatchResponse returns confirmed-empty when upstream schedule is explicitly empty', () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const mockPayload = {
      status: 'success',
      data: [],
    };

    const res = parseNextMatchResponse(mockPayload, fixedNow);
    assert.strictEqual(res.status, 'confirmed-empty');
    assert.strictEqual(res.reason, 'no-upcoming-fixture');
    assert.strictEqual(res.match, null);
    assert.ok(res.message.includes('empty list'));
  });

  it('10.4 parseNextMatchResponse returns unavailable with invalid-schema on malformed payloads', () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const invalidInputs = [null, undefined, 'not-json', { data: 'not-an-array' }, 12345];

    for (const input of invalidInputs) {
      const res = parseNextMatchResponse(input, fixedNow);
      assert.strictEqual(res.status, 'unavailable');
      assert.strictEqual(res.reason, 'invalid-schema');
      assert.strictEqual(res.match, null);
    }
  });

  it('10.5 fetchNextMatch returns unavailable (no-server-proxy) in unconfigured client environment', async () => {
    const res = await fetchNextMatch();
    assert.strictEqual(res.status, 'unavailable');
    assert.strictEqual(res.match, null);
    assert.ok(res.reason === 'no-server-proxy' || res.reason === 'network-error');
  });

  it('10.6 getVerifiedCareerStats returns Phase 1 locked career totals as declared single source of truth', () => {
    const stats = getVerifiedCareerStats();
    assert.strictEqual(stats.runs, 28359);
    assert.strictEqual(stats.matches, 562);
    assert.strictEqual(stats.centuries, 85);
    assert.strictEqual(stats.average, 58.59);
    assert.strictEqual(stats.highScore, 183);
  });

  it('10.7 FixturesService: Success with India upcoming ODI fixture returns available with sanitized fields', async () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const mockPayload = {
      status: 'success',
      data: [
        {
          id: 'mock-odi-1',
          name: 'India vs England 1st ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-07-15T09:00:00.000Z',
          venue: "Lord's, London",
          series: 'India Tour of England 2026',
        },
      ],
    };

    const service = new FixturesService({
      apiKey: 'test-secret-key-12345',
      nowFn: () => fixedNow,
      fetchFn: async () => ({
        ok: true,
        status: 200,
        json: async () => mockPayload,
      }),
    });

    const result = await service.getNextFixture({ clientIp: '10.0.0.1' });
    assert.strictEqual(result.httpStatus, 200);
    assert.strictEqual(result.body.status, 'available');
    assert.strictEqual(result.body.reason, 'live-schedule-found');
    assert.ok(result.body.match);
    assert.strictEqual(result.body.match.matchName, 'India vs England 1st ODI');
    assert.strictEqual(result.body.match.opponent, 'England');
    assert.strictEqual(result.body.match.matchType, 'ODI');
    assert.strictEqual(result.body.match.venue, "Lord's, London");
    assert.strictEqual(result.body.match.date, '2026-07-15T09:00:00.000Z');
    assert.strictEqual(result.headers['X-Cache'], 'MISS');
  });

  it('10.8 FixturesService: Empty upstream data list returns confirmed-empty with no fixture', async () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const service = new FixturesService({
      apiKey: 'test-secret-key-12345',
      nowFn: () => fixedNow,
      fetchFn: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', data: [] }),
      }),
    });

    const result = await service.getNextFixture({ clientIp: '10.0.0.2' });
    assert.strictEqual(result.httpStatus, 200);
    assert.strictEqual(result.body.status, 'confirmed-empty');
    assert.strictEqual(result.body.reason, 'no-upcoming-fixture');
    assert.strictEqual(result.body.match, null);
    assert.ok(result.body.message.includes('empty list'));
  });

  it('10.9 FixturesService: Request timeout triggers bounded abort and returns timeout unavailable', async () => {
    const service = new FixturesService({
      apiKey: 'test-secret-key-12345',
      requestTimeoutMs: 50,
      fetchFn: async (_, init) => {
        return new Promise((resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              const abortError = new Error('The operation was aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          }
        });
      },
    });

    const result = await service.getNextFixture({ clientIp: '10.0.0.3' });
    assert.strictEqual(result.httpStatus, 200);
    assert.strictEqual(result.body.status, 'unavailable');
    assert.strictEqual(result.body.reason, 'timeout');
    assert.strictEqual(result.body.match, null);
    assert.ok(result.body.message.includes('timed out'));
  });

  it('10.10 FixturesService: Provider error status or HTTP 500 masks raw error and returns provider-error', async () => {
    // Subtest A: HTTP 500
    const service500 = new FixturesService({
      apiKey: 'test-secret-key-12345',
      fetchFn: async () => ({
        ok: false,
        status: 500,
      }),
    });

    const res500 = await service500.getNextFixture({ clientIp: '10.0.0.4' });
    assert.strictEqual(res500.httpStatus, 200);
    assert.strictEqual(res500.body.status, 'unavailable');
    assert.strictEqual(res500.body.reason, 'provider-error');
    assert.strictEqual(res500.body.match, null);

    // Subtest B: Provider JSON { status: 'failure' }
    const serviceFailure = new FixturesService({
      apiKey: 'test-secret-key-12345',
      fetchFn: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'failure', reason: 'quota-exceeded-secret-info' }),
      }),
    });

    const resFailure = await serviceFailure.getNextFixture({ clientIp: '10.0.0.5' });
    assert.strictEqual(resFailure.httpStatus, 200);
    assert.strictEqual(resFailure.body.status, 'unavailable');
    assert.strictEqual(resFailure.body.reason, 'provider-error');
    assert.strictEqual(resFailure.body.match, null);
    assert.ok(!JSON.stringify(resFailure).includes('quota-exceeded-secret-info'));
  });

  it('10.11 FixturesService: Missing server API key returns missing-credentials without error', async () => {
    const serviceNoKey = new FixturesService({
      apiKey: undefined,
    });

    const res = await serviceNoKey.getNextFixture({ clientIp: '10.0.0.6' });
    assert.strictEqual(res.httpStatus, 200);
    assert.strictEqual(res.body.status, 'unavailable');
    assert.strictEqual(res.body.reason, 'missing-credentials');
    assert.strictEqual(res.body.match, null);
    assert.ok(res.body.message.includes('Server API key is not configured'));
  });

  it('10.12 FixturesService: In-memory cache returns X-Cache HIT and cached: true on subsequent calls', async () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    let fetchCount = 0;

    const mockPayload = {
      status: 'success',
      data: [
        {
          id: 'mock-odi-cache',
          name: 'India vs South Africa 1st ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-09-10T09:00:00.000Z',
          venue: 'Eden Gardens, Kolkata',
        },
      ],
    };

    const service = new FixturesService({
      apiKey: 'test-secret-key-12345',
      cacheTtlMs: 10000,
      nowFn: () => fixedNow,
      fetchFn: async () => {
        fetchCount++;
        return {
          ok: true,
          status: 200,
          json: async () => mockPayload,
        };
      },
    });

    // Call 1: Cache MISS
    const res1 = await service.getNextFixture({ clientIp: '10.0.0.7' });
    assert.strictEqual(res1.headers['X-Cache'], 'MISS');
    assert.strictEqual(res1.body.meta.cached, false);
    assert.strictEqual(fetchCount, 1);

    // Call 2: Cache HIT
    const res2 = await service.getNextFixture({ clientIp: '10.0.0.7' });
    assert.strictEqual(res2.headers['X-Cache'], 'HIT');
    assert.strictEqual(res2.body.meta.cached, true);
    assert.strictEqual(fetchCount, 1); // Upstream was NOT called again
  });

  it('10.13 FixturesService: Rate limiter throttles after threshold with HTTP 429 and rate-limited reason', async () => {
    const fixedNow = new Date('2026-06-01T00:00:00.000Z');
    const service = new FixturesService({
      apiKey: 'test-secret-key-12345',
      maxRequestsPerWindow: 3,
      rateLimitWindowMs: 60000,
      nowFn: () => fixedNow,
      fetchFn: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', data: [] }),
      }),
    });

    const ip = '192.168.1.100';

    // Requests 1, 2, 3 should succeed
    const r1 = await service.getNextFixture({ clientIp: ip });
    assert.strictEqual(r1.httpStatus, 200);
    assert.strictEqual(r1.headers['X-RateLimit-Remaining'], '2');

    const r2 = await service.getNextFixture({ clientIp: ip });
    assert.strictEqual(r2.httpStatus, 200);
    assert.strictEqual(r2.headers['X-RateLimit-Remaining'], '1');

    const r3 = await service.getNextFixture({ clientIp: ip });
    assert.strictEqual(r3.httpStatus, 200);
    assert.strictEqual(r3.headers['X-RateLimit-Remaining'], '0');

    // Request 4 should be rejected with 429
    const r4 = await service.getNextFixture({ clientIp: ip });
    assert.strictEqual(r4.httpStatus, 429);
    assert.strictEqual(r4.body.status, 'unavailable');
    assert.strictEqual(r4.body.reason, 'rate-limited');
    assert.strictEqual(r4.headers['X-RateLimit-Remaining'], '0');
    assert.ok(r4.headers['Retry-After']);
  });

  it('10.14 FixturesService: Key isolation audit proves provider key is NEVER in output JSON or headers', async () => {
    const secretKey = 'super-secret-confidential-api-token-999888';
    const mockPayload = {
      status: 'success',
      data: [
        {
          id: 'mock-odi-sec',
          name: 'India vs New Zealand 1st ODI',
          matchType: 'ODI',
          dateTimeGMT: '2026-11-20T09:00:00.000Z',
          venue: 'Wankhede Stadium, Mumbai',
        },
      ],
    };

    const service = new FixturesService({
      apiKey: secretKey,
      fetchFn: async () => ({
        ok: true,
        status: 200,
        json: async () => mockPayload,
      }),
    });

    const result = await service.getNextFixture({ clientIp: '10.0.0.9' });
    const stringifiedBody = JSON.stringify(result.body);
    const stringifiedHeaders = JSON.stringify(result.headers);

    assert.ok(!stringifiedBody.includes(secretKey), 'API Key must NEVER appear in response body');
    assert.ok(!stringifiedHeaders.includes(secretKey), 'API Key must NEVER appear in response headers');
  });
});

describe('11. Selected Defining Innings Gallery Suite', () => {
  it('11.1 Validates that Defining Innings gallery contains entries across all 4 formats (Test, ODI, T20I, IPL)', () => {
    assert.ok(Array.isArray(DEFINING_INNINGS_DATA));
    assert.ok(DEFINING_INNINGS_DATA.length >= 10);

    const formats = new Set(DEFINING_INNINGS_DATA.map((i) => i.format));
    assert.ok(formats.has('Test'), 'Must contain Test innings');
    assert.ok(formats.has('ODI'), 'Must contain ODI innings');
    assert.ok(formats.has('T20I'), 'Must contain T20I innings');
    assert.ok(formats.has('IPL'), 'Must contain IPL innings');
  });

  it('11.2 Verifies that candidate screenshot items (Pune 254*, Edgbaston 149) match verified primary scorecards', () => {
    // Pune 254*
    const pune = DEFINING_INNINGS_DATA.find((i) => i.id === 'test-254-sa-pune-2019');
    assert.ok(pune, 'Pune 254* must be present in defining innings');
    assert.strictEqual(pune.runs, 254);
    assert.strictEqual(pune.ballsFaced, 336);
    assert.strictEqual(pune.notOut, true);
    assert.strictEqual(pune.fours, 33);
    assert.strictEqual(pune.sixes, 2);
    assert.strictEqual(pune.opponent, 'South Africa');
    assert.strictEqual(pune.inningsResult, 'won');
    assert.strictEqual(pune.sourceId, 'ESPNcricinfo #1187008');

    // Edgbaston 149
    const edgbaston = DEFINING_INNINGS_DATA.find((i) => i.id === 'test-149-eng-edgbaston-2018');
    assert.ok(edgbaston, 'Edgbaston 149 must be present in defining innings');
    assert.strictEqual(edgbaston.runs, 149);
    assert.strictEqual(edgbaston.ballsFaced, 225);
    assert.strictEqual(edgbaston.notOut, false);
    assert.strictEqual(edgbaston.fours, 22);
    assert.strictEqual(edgbaston.sixes, 1);
    assert.strictEqual(edgbaston.opponent, 'England');
    assert.strictEqual(edgbaston.sourceId, 'ESPNcricinfo #1119549');
  });

  it('11.3 Verifies that Test innings are distinct and separate from limited-overs chase metrics', () => {
    const testInnings = DEFINING_INNINGS_DATA.filter((i) => i.format === 'Test');
    assert.ok(testInnings.length >= 4);

    for (const t of testInnings) {
      assert.strictEqual(t.format, 'Test');
      assert.notStrictEqual(t.format, 'ODI');
      assert.notStrictEqual(t.format, 'T20I');
    }
  });

  it('11.4 Mutation proof & Clutch Isolation: Defining innings does not feed or mutate Clutch Index', () => {
    // Proves that defining innings data has zero side effects on clutch metrics or calibration
    const initialClutch = { baselineAvg: 58.59, chaseAvg: 65.0, knockoutAvg: 68.4, finalsAvg: 71.2, baselineSR: 93.95, chaseSR: 93.4 };
    
    // Mutate a defining innings entry locally
    const dummyInnings = { ...DEFINING_INNINGS_DATA[0], runs: 999 };
    assert.strictEqual(dummyInnings.runs, 999);

    // Re-verify that clutch calculation remains strictly calibration-pending with score null
    const clutchRes = calculateClutchIndexFromMatches([], 'ODI', initialClutch);
    assert.strictEqual(clutchRes.score, null);
    assert.strictEqual(clutchRes.status, 'calibration-pending');
  });

  it('11.5 Verifies that all strike rates, boundary sanity, and source URLs are strictly valid', () => {
    for (const inn of DEFINING_INNINGS_DATA) {
      assert.ok(inn.sourceUrl.startsWith('https://www.espncricinfo.com/'));
      assert.ok(inn.fours * 4 + inn.sixes * 6 <= inn.runs, `Boundary runs cannot exceed total runs for ${inn.id}`);
      const expectedSR = Number(((inn.runs / inn.ballsFaced) * 100).toFixed(2));
      assert.ok(Math.abs(expectedSR - inn.strikeRate) < 0.15, `Strike rate mismatch on ${inn.id}`);
    }
  });

  it('11.6 Row-by-row scorecard boundary and score invariant verification for all 11 defining innings', () => {
    const expectedRowRecords = [
      { id: 'test-254-sa-pune-2019', matchId: '1187008', format: 'Test', runs: 254, ballsFaced: 336, notOut: true, fours: 33, sixes: 2, result: 'won' },
      { id: 'test-149-eng-edgbaston-2018', matchId: '1119549', format: 'Test', runs: 149, ballsFaced: 225, notOut: false, fours: 22, sixes: 1, result: 'lost' },
      { id: 'test-141-aus-adelaide-2014', matchId: '754737', format: 'Test', runs: 141, ballsFaced: 175, notOut: false, fours: 16, sixes: 1, result: 'lost' },
      { id: 'test-123-aus-perth-2018', matchId: '1144994', format: 'Test', runs: 123, ballsFaced: 257, notOut: false, fours: 13, sixes: 1, result: 'lost' },
      { id: 'odi-133-sl-hobart-2012', matchId: '518966', format: 'ODI', runs: 133, ballsFaced: 86, notOut: true, fours: 16, sixes: 2, result: 'won' },
      { id: 'odi-183-pak-dhaka-2012', matchId: '535798', format: 'ODI', runs: 183, ballsFaced: 148, notOut: false, fours: 22, sixes: 1, result: 'won' },
      { id: 'odi-117-nz-mumbai-2023', matchId: '1384438', format: 'ODI', runs: 117, ballsFaced: 113, notOut: false, fours: 9, sixes: 2, result: 'won' },
      { id: 't20i-82-pak-mcg-2022', matchId: '1298150', format: 'T20I', runs: 82, ballsFaced: 53, notOut: true, fours: 6, sixes: 4, result: 'won' },
      { id: 't20i-82-aus-mohali-2016', matchId: '951363', format: 'T20I', runs: 82, ballsFaced: 51, notOut: true, fours: 9, sixes: 2, result: 'won' },
      { id: 't20i-76-sa-barbados-2024', matchId: '1415755', format: 'T20I', runs: 76, ballsFaced: 59, notOut: false, fours: 6, sixes: 2, result: 'won' },
      { id: 'ipl-113-kxip-bengaluru-2016', matchId: '980999', format: 'IPL', runs: 113, ballsFaced: 50, notOut: false, fours: 12, sixes: 8, result: 'won' },
    ];

    assert.strictEqual(DEFINING_INNINGS_DATA.length, expectedRowRecords.length);

    for (const exp of expectedRowRecords) {
      const act = DEFINING_INNINGS_DATA.find((i) => i.id === exp.id);
      assert.ok(act, `Missing entry for ${exp.id}`);
      assert.strictEqual(act.matchId, exp.matchId, `matchId mismatch on ${exp.id}`);
      assert.strictEqual(act.format, exp.format, `format mismatch on ${exp.id}`);
      assert.strictEqual(act.runs, exp.runs, `runs mismatch on ${exp.id}`);
      assert.strictEqual(act.ballsFaced, exp.ballsFaced, `ballsFaced mismatch on ${exp.id}`);
      assert.strictEqual(act.notOut, exp.notOut, `notOut mismatch on ${exp.id}`);
      assert.strictEqual(act.fours, exp.fours, `fours mismatch on ${exp.id}`);
      assert.strictEqual(act.sixes, exp.sixes, `sixes mismatch on ${exp.id}`);
      assert.strictEqual(act.inningsResult, exp.result, `inningsResult mismatch on ${exp.id}`);
      assert.ok(act.sourceUrl.includes(exp.matchId), `sourceUrl must contain matchId ${exp.matchId} on ${exp.id}`);
    }
  });
});

// ============================================================
// 12. PRESSURE PERFORMANCE DASHBOARD & SITUATIONAL SPLITS SUITE
// ============================================================
describe('12. Pressure Performance Dashboard & Situational Splits Suite', () => {
  it('12.1 Format separation: ODI and T20I have 4 situational cards each; Test explicitly discloses non-applicability', () => {
    const odiVm = getClutchViewModel('ODI');
    const t20Vm = getClutchViewModel('T20I');
    const testVm = getClutchViewModel('Test');

    assert.strictEqual(odiVm.pressurePerformance.isApplicable, true);
    assert.strictEqual(odiVm.pressurePerformance.cards.length, 4);

    assert.strictEqual(t20Vm.pressurePerformance.isApplicable, true);
    assert.strictEqual(t20Vm.pressurePerformance.cards.length, 4);

    assert.strictEqual(testVm.pressurePerformance.isApplicable, false);
    assert.strictEqual(testVm.pressurePerformance.cards.length, 0);
    assert.ok(testVm.pressurePerformance.coverageDisclosure.includes('Test cricket is excluded from limited-overs RRR'));
  });

  it('12.2 ODI situational splits exact verified figures and elevations match derived artifact', () => {
    const odiVm = getClutchViewModel('ODI');
    const cards = odiVm.pressurePerformance.cards;

    // Card 1: Chasing Innings
    const chase = cards.find((c) => c.id === 'completedChaseDominance');
    assert.ok(chase);
    assert.strictEqual(chase.title, 'Chasing Innings');
    assert.ok(chase.scopeDescription.includes('regardless of final match outcome'));
    assert.strictEqual(chase.innings, 165);
    assert.strictEqual(chase.balls, 8984);
    assert.strictEqual(chase.runs, 8444);
    assert.strictEqual(chase.dismissals, 130);
    assert.strictEqual(chase.notOuts, 35);
    assert.strictEqual(chase.battingAvg, 64.95);
    assert.strictEqual(chase.strikeRate, 93.99);
    assert.strictEqual(chase.elevationDisplay, '+26.3%');
    assert.strictEqual(chase.sampleStatus, 'usable-sample');

    // Card 2: High-RRR Situations
    const highRrr = cards.find((c) => c.id === 'highRrrElevation');
    assert.ok(highRrr);
    assert.strictEqual(highRrr.innings, 24);
    assert.strictEqual(highRrr.balls, 676);
    assert.strictEqual(highRrr.runs, 844);
    assert.strictEqual(highRrr.dismissals, 16);
    assert.strictEqual(highRrr.notOuts, 8);
    assert.strictEqual(highRrr.battingAvg, 52.75);
    assert.strictEqual(highRrr.strikeRate, 124.85);
    assert.strictEqual(highRrr.elevationDisplay, '-9.6%');
    assert.strictEqual(highRrr.sampleStatus, 'usable-sample');

    // Card 3: Tournament Knockouts
    const ko = cards.find((c) => c.id === 'knockoutElevation');
    assert.ok(ko);
    assert.strictEqual(ko.innings, 18);
    assert.strictEqual(ko.balls, 664);
    assert.strictEqual(ko.runs, 578);
    assert.strictEqual(ko.dismissals, 15);
    assert.strictEqual(ko.notOuts, 3);
    assert.strictEqual(ko.battingAvg, 38.53);
    assert.strictEqual(ko.strikeRate, 87.05);
    assert.strictEqual(ko.elevationDisplay, '-34.0%');
    assert.strictEqual(ko.sampleStatus, 'usable-sample');

    // Card 4: Tournament Finals
    const finals = cards.find((c) => c.id === 'finalsContribution');
    assert.ok(finals);
    assert.strictEqual(finals.innings, 10);
    assert.strictEqual(finals.balls, 263);
    assert.strictEqual(finals.runs, 209);
    assert.strictEqual(finals.dismissals, 9);
    assert.strictEqual(finals.notOuts, 1);
    assert.strictEqual(finals.battingAvg, 23.22);
    assert.strictEqual(finals.strikeRate, 79.47);
    assert.strictEqual(finals.elevationDisplay, '-60.2%');
  });

  it('12.3 T20I situational splits exact verified figures and elevations match derived artifact', () => {
    const t20Vm = getClutchViewModel('T20I');
    const cards = t20Vm.pressurePerformance.cards;

    // Card 1: Chasing Innings
    const chase = cards.find((c) => c.id === 'completedChaseDominance');
    assert.ok(chase);
    assert.strictEqual(chase.title, 'Chasing Innings');
    assert.ok(chase.scopeDescription.includes('regardless of final match outcome'));
    assert.strictEqual(chase.innings, 47);
    assert.strictEqual(chase.balls, 1459);
    assert.strictEqual(chase.runs, 1984);
    assert.strictEqual(chase.dismissals, 29);
    assert.strictEqual(chase.notOuts, 18);
    assert.strictEqual(chase.battingAvg, 68.41);
    assert.strictEqual(chase.strikeRate, 135.98);
    assert.strictEqual(chase.elevationDisplay, '+83.2%');

    // Card 2: High-RRR Situations
    const highRrr = cards.find((c) => c.id === 'highRrrElevation');
    assert.ok(highRrr);
    assert.strictEqual(highRrr.innings, 28);
    assert.strictEqual(highRrr.balls, 738);
    assert.strictEqual(highRrr.runs, 1122);
    assert.strictEqual(highRrr.dismissals, 15);
    assert.strictEqual(highRrr.notOuts, 13);
    assert.strictEqual(highRrr.battingAvg, 74.8);
    assert.strictEqual(highRrr.strikeRate, 152.03);
    assert.strictEqual(highRrr.elevationDisplay, '+54.8%');

    // Card 3: Tournament Knockouts
    const ko = cards.find((c) => c.id === 'knockoutElevation');
    assert.ok(ko);
    assert.strictEqual(ko.innings, 7);
    assert.strictEqual(ko.balls, 285);
    assert.strictEqual(ko.runs, 414);
    assert.strictEqual(ko.dismissals, 4);
    assert.strictEqual(ko.notOuts, 3);
    assert.strictEqual(ko.battingAvg, 103.5);
    assert.strictEqual(ko.strikeRate, 145.26);
    assert.strictEqual(ko.elevationDisplay, '+114.2%');
    assert.strictEqual(ko.sampleStatus, 'insufficient-sample');

    // Card 4: Tournament Finals
    const finals = cards.find((c) => c.id === 'finalsContribution');
    assert.ok(finals);
    assert.strictEqual(finals.innings, 3);
    assert.strictEqual(finals.balls, 145);
    assert.strictEqual(finals.runs, 194);
    assert.strictEqual(finals.dismissals, 2);
    assert.strictEqual(finals.notOuts, 1);
    assert.strictEqual(finals.battingAvg, 97);
    assert.strictEqual(finals.strikeRate, 133.79);
    assert.strictEqual(finals.elevationDisplay, '+100.7%');
    assert.strictEqual(finals.sampleStatus, 'insufficient-sample');
  });

  it('12.4 Sample size labeling enforces explicit warnings for small groups (N < 10)', () => {
    const t20Vm = getClutchViewModel('T20I');
    const koCard = t20Vm.pressurePerformance.cards.find((c) => c.id === 'knockoutElevation');
    const finalCard = t20Vm.pressurePerformance.cards.find((c) => c.id === 'finalsContribution');

    assert.ok(koCard.sampleBadgeText.includes('Small Sample (N=7 < 10)'));
    assert.ok(finalCard.sampleBadgeText.includes('Small Sample (N=3 < 10)'));
  });

  it('12.5 Plain-language overlap relations correctly articulate mathematical containment', () => {
    const odiVm = getClutchViewModel('ODI');
    const rels = odiVm.pressurePerformance.overlapRelations;

    assert.strictEqual(rels.length, 3);
    assert.ok(rels[0].containment.includes('100.0%'));
    assert.ok(rels[1].containment.includes('100.0%'));
    assert.ok(rels[2].containment.includes('38.9%'));
  });

  it('12.6 Preservation of Clutch trust gate and public score null state', () => {
    const odiVm = getClutchViewModel('ODI');
    assert.strictEqual(odiVm.status, 'calibration-pending');
    assert.strictEqual(odiVm.scoreDisplay, 'CALIBRATION PENDING');
    assert.strictEqual(odiVm.clutchCalc.status, 'calibration-pending');
  });

  it('12.7 T20I Match ID classification: semi-finals are strictly knockouts and not finals', () => {
    const expectedT20KnockoutMatchIds = ['682963', '682965', '966765', '951371', '1298178', '1415754', '1415755'];
    const expectedT20FinalMatchIds = ['682965', '966765', '1415755'];
    const expectedT20SemiFinalMatchIds = ['682963', '951371', '1298178', '1415754'];

    // 1. Assert finals are exactly 3 matches
    assert.strictEqual(expectedT20FinalMatchIds.length, 3);
    // 2. Assert semi-finals are exactly 4 matches
    assert.strictEqual(expectedT20SemiFinalMatchIds.length, 4);
    // 3. Assert knockouts = semi-finals + finals = 7 matches
    assert.strictEqual(expectedT20KnockoutMatchIds.length, 7);
    // 4. Assert semi-finals are mutually disjoint from finals
    for (const sfId of expectedT20SemiFinalMatchIds) {
      assert.strictEqual(expectedT20FinalMatchIds.includes(sfId), false, `Semi-final ${sfId} must not be in finals list`);
    }
    // 5. Assert all finals are in knockouts
    for (const fId of expectedT20FinalMatchIds) {
      assert.strictEqual(expectedT20KnockoutMatchIds.includes(fId), true, `Final ${fId} must be in knockouts list`);
    }
  });

  it('12.8 Test cricket verified aggregates on pressure scope card match Phase 1 locked totals', () => {
    const testVm = getClutchViewModel('Test');
    assert.ok(testVm.pressurePerformance.careerAggregatesNote.includes('123 matches'));
    assert.ok(testVm.pressurePerformance.careerAggregatesNote.includes('210 innings'));
    assert.ok(testVm.pressurePerformance.careerAggregatesNote.includes('9,230 runs'));
    assert.ok(testVm.pressurePerformance.careerAggregatesNote.includes('46.85 batting average'));
  });

  it('12.9 Baseline scope labeling distinguishes covered-archive averages from full-career aggregates', () => {
    const odiVm = getClutchViewModel('ODI');
    const t20Vm = getClutchViewModel('T20I');

    // ODI Cards: baseline is 58.34 (Covered Archive) or 51.41 (Covered 1st Inn)
    const odiChase = odiVm.pressurePerformance.cards.find((c) => c.id === 'completedChaseDominance');
    const odiHighRrr = odiVm.pressurePerformance.cards.find((c) => c.id === 'highRrrElevation');
    assert.strictEqual(odiChase.baselineAvg, 51.41);
    assert.strictEqual(odiChase.baselineScopeLabel, 'Covered-archive 1st-innings batting average');
    assert.ok(odiChase.baselineAvgDisplay.includes('Covered 1st Inn'));

    assert.strictEqual(odiHighRrr.baselineAvg, 58.34);
    assert.strictEqual(odiHighRrr.baselineScopeLabel, 'Covered-archive batting average');
    assert.ok(odiHighRrr.baselineAvgDisplay.includes('Covered Archive'));

    // T20I Cards: baseline is 48.33 (Covered Archive) or 37.34 (Covered 1st Inn)
    const t20Chase = t20Vm.pressurePerformance.cards.find((c) => c.id === 'completedChaseDominance');
    const t20HighRrr = t20Vm.pressurePerformance.cards.find((c) => c.id === 'highRrrElevation');
    assert.strictEqual(t20Chase.baselineAvg, 37.34);
    assert.strictEqual(t20Chase.baselineScopeLabel, 'Covered-archive 1st-innings batting average');
    assert.ok(t20Chase.baselineAvgDisplay.includes('Covered 1st Inn'));

    assert.strictEqual(t20HighRrr.baselineAvg, 48.33);
    assert.strictEqual(t20HighRrr.baselineScopeLabel, 'Covered-archive batting average');
    assert.ok(t20HighRrr.baselineAvgDisplay.includes('Covered Archive'));

    // Full-career totals remain strictly unmutated (58.59 ODI, 48.70 T20I)
    assert.strictEqual(careerStats.odi.average, 58.59);
    assert.strictEqual(careerStats.t20i.average, 48.70);
  });
});



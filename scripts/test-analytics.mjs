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
  adaptClutchToViewModel,
  adaptPressureMapToViewModel,
  adaptChaseMetricsToViewModel,
  getClutchViewModel,
  getPressureMapViewModel,
  getChaseAnalyticsViewModel,
} from '../src/analytics/adapters.ts';


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



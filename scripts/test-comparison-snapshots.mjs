import { it } from 'node:test';
import assert from 'node:assert/strict';
import snapshots from '../src/dashboard/comparisonSnapshots.json' with { type: 'json' };
import { careerStats } from '../src/data/kohliData.ts';
import artifact from '../src/data/derived/kohliAnalyticsArtifact.json' with { type: 'json' };

// Independent authoritative benchmarks from official match records
const INDEPENDENT_CAREER_BENCHMARKS = {
  test: {
    runs: 9230,
    innings: 210,
    notOuts: 13,
    dismissals: 197,
    ballsFaced: 16608,
    expectedAvg: 46.85, // 9230 / 197 = 46.85279... -> 46.85
    expectedSR: 55.58,  // (9230 / 16608) * 100 = 55.5756... -> 55.58
    centuries: 30,
    fifties: 31,
    lastMatch: '2025-01-03',
  },
  odi: {
    runs: 15080,
    innings: 303,
    notOuts: 48,
    dismissals: 255,
    ballsFaced: 15991,
    expectedAvg: 59.14, // 15080 / 255 = 59.13725... -> 59.14
    expectedSR: 94.30,  // (15080 / 15991) * 100 = 94.3030... -> 94.30
    centuries: 55,
    fifties: 79,
    lastMatch: '2026-09-27',
  },
  t20i: {
    runs: 4188,
    innings: 117,
    notOuts: 31,
    dismissals: 86,
    ballsFaced: 3056,
    expectedAvg: 48.70, // 4188 / 86 = 48.69767... -> 48.70
    expectedSR: 137.04, // (4188 / 3056) * 100 = 137.0418... -> 137.04
    centuries: 1,
    fifties: 38,
    lastMatch: '2024-06-29',
  },
  ipl: {
    runs: 9336,
    innings: 275,
    notOuts: 44,
    dismissals: 231,
    ballsFaced: 6926,
    expectedAvg: 40.42, // 9336 / 231 = 40.41558... -> 40.42
    expectedSR: 134.80, // (9336 / 6926) * 100 = 134.7964... -> 134.80
    centuries: 9,
    fifties: 68,
  },
};

it('all 21 comparison records carry dated source provenance and reconcilable rates', () => {
  assert.equal(Object.keys(snapshots).length, 7);
  for (const player of Object.values(snapshots)) {
    assert.match(player.source, /^https:\/\/www\.cricbuzz\.com\/profiles\//);
    assert.match(player.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(Object.keys(player.formats).sort(), ['ODI', 'T20I', 'Test']);
    for (const [format, s] of Object.entries(player.formats)) {
      assert.ok(s.lastMatch <= player.checkedAt);
      assert.ok(s.innings > s.notOuts && s.balls > 0);
      assert.ok(
        Math.abs(s.runs / (s.innings - s.notOuts) - s.battingAvg) < 0.02,
        player.source + ' ' + format + ' average',
      );
      assert.ok(
        Math.abs((s.runs / s.balls) * 100 - s.strikeRate) < 0.02,
        player.source + ' ' + format + ' strike rate',
      );
    }
  }
});

it('validates Kohli career averages, strike rates, balls faced and fifties against independent benchmarks', () => {
  const k = snapshots.kohli.formats;

  for (const [fmt, bench] of Object.entries(INDEPENDENT_CAREER_BENCHMARKS)) {
    // 1. Average arithmetic check: runs / (innings - notOuts) == expectedAvg
    const dismissals = bench.innings - bench.notOuts;
    assert.equal(dismissals, bench.dismissals, `${fmt} dismissals mismatch`);
    const computedAvg = Math.round((bench.runs / dismissals) * 100) / 100;
    assert.equal(computedAvg, bench.expectedAvg, `${fmt} arithmetic average calculation`);

    // 2. Strike rate arithmetic check: (runs / ballsFaced) * 100 == expectedSR
    const rawSR = (bench.runs / bench.ballsFaced) * 100;
    const computedSR = Math.round(rawSR * 100) / 100;
    assert.equal(computedSR, bench.expectedSR, `${fmt} arithmetic strike rate calculation`);

    // 3. Validate against careerStats: ballsFaced, strikeRate, fifties, runs, innings, notOuts
    const cs = careerStats[fmt];
    assert.equal(cs.runs, bench.runs, `${fmt} careerStats runs`);
    assert.equal(cs.innings, bench.innings, `${fmt} careerStats innings`);
    assert.equal(cs.notOuts, bench.notOuts, `${fmt} careerStats notOuts`);
    assert.equal(cs.dismissals, bench.dismissals, `${fmt} careerStats dismissals`);
    assert.equal(cs.ballsFaced, bench.ballsFaced, `${fmt} careerStats ballsFaced`);
    assert.equal(cs.average, bench.expectedAvg, `${fmt} careerStats average`);
    assert.equal(cs.centuries, bench.centuries, `${fmt} careerStats centuries`);
    assert.equal(cs.fifties, bench.fifties, `${fmt} careerStats fifties`);

    // Verify documented strike rate rounding from actual careerStats runs / ballsFaced * 100
    const csCalculatedSR = (cs.runs / cs.ballsFaced) * 100;
    if (fmt === 'ipl') {
      // IPL strike rate is documented to 1 decimal place (134.8)
      assert.equal(Math.round(csCalculatedSR * 10) / 10, cs.strikeRate, 'IPL strike rate rounded to 1 d.p.');
    } else {
      assert.equal(Math.round(csCalculatedSR * 100) / 100, cs.strikeRate, `${fmt} strike rate rounded to 2 d.p.`);
    }

    // 4. Validate against international comparison snapshots: balls, strikeRate, and core rates
    if (fmt === 'test' || fmt === 'odi' || fmt === 't20i') {
      const snapKey = fmt === 'test' ? 'Test' : fmt === 'odi' ? 'ODI' : 'T20I';
      const snap = k[snapKey];
      assert.equal(snap.runs, bench.runs, `${fmt} snapshot runs`);
      assert.equal(snap.innings, bench.innings, `${fmt} snapshot innings`);
      assert.equal(snap.notOuts, bench.notOuts, `${fmt} snapshot notOuts`);
      assert.equal(snap.balls, bench.ballsFaced, `${fmt} snapshot balls against benchmark`);
      assert.equal(snap.centuries, bench.centuries, `${fmt} snapshot centuries`);
      assert.equal(snap.battingAvg, bench.expectedAvg, `${fmt} snapshot battingAvg`);
      assert.equal(snap.lastMatch, bench.lastMatch, `${fmt} snapshot lastMatch`);

      // Assert comparison snapshot strikeRate against benchmark
      if (fmt === 'odi') {
        assert.equal(Math.round(snap.strikeRate * 10) / 10, Math.round(bench.expectedSR * 10) / 10, 'ODI snapshot strikeRate (1 d.p.)');
      } else {
        assert.ok(
          Math.abs(snap.strikeRate - bench.expectedSR) < 0.02,
          `${fmt} snapshot strikeRate (${snap.strikeRate}) against benchmark (${bench.expectedSR})`,
        );
      }
    }
  }
});

it('verifies cross-format international sum invariants', () => {
  const seniorRuns =
    INDEPENDENT_CAREER_BENCHMARKS.test.runs +
    INDEPENDENT_CAREER_BENCHMARKS.odi.runs +
    INDEPENDENT_CAREER_BENCHMARKS.t20i.runs;
  assert.equal(seniorRuns, 28498, 'Senior international career runs invariant');
  assert.equal(careerStats.overall.runs, 28498, 'careerStats.overall runs invariant');

  const seniorInnings =
    INDEPENDENT_CAREER_BENCHMARKS.test.innings +
    INDEPENDENT_CAREER_BENCHMARKS.odi.innings +
    INDEPENDENT_CAREER_BENCHMARKS.t20i.innings;
  assert.equal(seniorInnings, 630, 'Senior international career innings invariant');
  assert.equal(careerStats.overall.innings, 630, 'careerStats.overall innings invariant');

  const seniorDismissals =
    INDEPENDENT_CAREER_BENCHMARKS.test.dismissals +
    INDEPENDENT_CAREER_BENCHMARKS.odi.dismissals +
    INDEPENDENT_CAREER_BENCHMARKS.t20i.dismissals;
  assert.equal(seniorDismissals, 538, 'Senior international career dismissals invariant');
  assert.equal(careerStats.overall.dismissals, 538, 'careerStats.overall dismissals invariant');

  const seniorBalls =
    INDEPENDENT_CAREER_BENCHMARKS.test.ballsFaced +
    INDEPENDENT_CAREER_BENCHMARKS.odi.ballsFaced +
    INDEPENDENT_CAREER_BENCHMARKS.t20i.ballsFaced;
  assert.equal(seniorBalls, 35655, 'Senior international career balls faced invariant');
  assert.equal(careerStats.overall.ballsFaced, 35655, 'careerStats.overall ballsFaced invariant');

  const seniorAvg = Math.round((seniorRuns / seniorDismissals) * 100) / 100;
  assert.equal(seniorAvg, 52.97, 'Senior international career average invariant');
  assert.equal(careerStats.overall.average, 52.97, 'careerStats.overall average invariant');

  const seniorSR = Math.round((seniorRuns / seniorBalls) * 10000) / 100;
  assert.equal(seniorSR, 79.93, 'Senior international career strike rate invariant');
  assert.equal(careerStats.overall.strikeRate, 79.93, 'careerStats.overall strikeRate invariant');
});

it('audits delivery archive coverage against complete career records', () => {
  const cov = artifact.coverage.formats;

  // ODI: 300 archived delivery innings out of 303 career batting innings
  assert.equal(cov.ODI.referenceInnings, 303, 'ODI career reference innings');
  assert.equal(cov.ODI.archiveInnings, 300, 'ODI archived delivery innings');
  assert.equal(cov.ODI.missingInnings, 3, 'ODI missing innings cataloged');
  assert.equal(cov.ODI.inningsCoveragePercent, 99.01, 'ODI archive coverage percent');

  // T20I: 112 archived delivery innings out of 117 career batting innings (NOT 100% complete)
  assert.equal(cov.T20I.referenceInnings, 117, 'T20I career reference innings');
  assert.equal(cov.T20I.archiveInnings, 112, 'T20I archived delivery innings');
  assert.equal(cov.T20I.missingInnings, 5, 'T20I missing innings cataloged');
  assert.equal(cov.T20I.inningsCoveragePercent, 95.73, 'T20I archive coverage percent');
});

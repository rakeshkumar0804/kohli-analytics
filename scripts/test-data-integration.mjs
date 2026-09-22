#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DERIVED_ARTIFACT_PATH = path.join(ROOT_DIR, 'data', 'derived', 'kohli-analytics.json');
const SRC_ARTIFACT_PATH = path.join(ROOT_DIR, 'src', 'data', 'derived', 'kohliAnalyticsArtifact.json');
const MANIFEST_PATH = path.join(ROOT_DIR, 'data', 'manifests', 'cricsheet-manifest.json');
const MATCH_REC_PATH = path.join(ROOT_DIR, 'data', 'derived', 'match-level-reconciliation.json');
const ORACLES_PATH = path.join(ROOT_DIR, 'data', 'fixtures', 'scorecard-oracles.json');
const MISSING_MATCHES_PATH = path.join(ROOT_DIR, 'data', 'fixtures', 'missing-reference-matches.json');
const REC_REPORT_PATH = path.join(ROOT_DIR, 'data', 'derived', 'reconciliation-report.json');

import { getClutchViewModel, getPressureMapViewModel, getChaseAnalyticsViewModel } from '../src/analytics/adapters.ts';
import { parseCricsheetMatch } from '../src/analytics/sources/cricsheet/parseCricsheetMatch.ts';
import { KOHLI_CRICSHEET_ID, KOHLI_EXTERNAL_IDS } from '../src/analytics/sources/cricsheet/mapRegistry.ts';

test('Data Integration & Independent Oracle Suite', async (t) => {
  if (!fs.existsSync(DERIVED_ARTIFACT_PATH)) {
    console.warn(`[SKIP] Derived artifact not found at ${DERIVED_ARTIFACT_PATH}. Run 'npm run data:refresh' to generate.`);
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(DERIVED_ARTIFACT_PATH, 'utf8'));

  await t.test('Integration 1: Manifest, Checksums, and Schema Version 1.2.0 Audit', () => {
    assert.ok(fs.existsSync(MANIFEST_PATH), 'Manifest file must exist');
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    assert.equal(manifest.datasetId, 'cricsheet-male-limited-overs');
    assert.equal(manifest.player.cricsheetPersonId, 'ba607b88');
    assert.equal(manifest.player.externalIds.espncricinfo, '253802');
    assert.ok(manifest.archives.length >= 2, 'Must have at least ODI and T20I archives');
    for (const arch of manifest.archives) {
      assert.ok(arch.sha256 && arch.sha256.length === 64, `Archive ${arch.filename} must have valid SHA-256`);
      assert.ok(arch.bytes > 0, `Archive ${arch.filename} size must be positive`);
    }
    assert.ok(manifest.schemaAudit.corpusDistribution['1.2.0'] > 0, 'Must record Schema 1.2.0 files');
  });

  await t.test('Integration 2: Player identity resolved via Cricsheet ID ba607b88 with distinct ESPN ID 253802', () => {
    assert.equal(artifact.player.canonicalName, 'Virat Kohli');
    assert.equal(artifact.player.cricsheetPersonId, KOHLI_CRICSHEET_ID);
    assert.equal(artifact.player.externalIds.espncricinfo, KOHLI_EXTERNAL_IDS.espncricinfo);
    assert.ok(artifact.coverage.totalMatches > 0, 'Total matches must be > 0');
  });

  await t.test('Integration 3: Five-Band Pressure Map produces valid cells for ODI and T20I', () => {
    const odiCells = artifact.pressureMap.ODI.cells;
    const t20iCells = artifact.pressureMap.T20I.cells;

    assert.equal(odiCells.length, 15, 'ODI must have exactly 15 cells (3 phases x 5 RRR bands)');
    assert.equal(t20iCells.length, 15, 'T20I must have exactly 15 cells (3 phases x 5 RRR bands)');

    const expectedBands = ['below-6', '6-to-8', '8-to-10', '10-to-12', 'above-12'];
    for (const band of expectedBands) {
      assert.ok(odiCells.some((c) => c.rrrBand === band), `ODI cells must contain band ${band}`);
      assert.ok(t20iCells.some((c) => c.rrrBand === band), `T20I cells must contain band ${band}`);
    }

    assert.equal(artifact.pressureMap.Test.status, 'unsupported-format');
  });

  await t.test('Integration 4: Clutch Index preserves trust gate (Calibration Pending)', () => {
    assert.equal(artifact.clutchIndex.status, 'calibration-pending');
    assert.equal(artifact.clutchIndex.score, null);
    assert.equal(artifact.clutchIndex.components.length, 4);
  });

  await t.test('Integration 5: UI Adapters consume artifact safely without regression', () => {
    const odiVm = getPressureMapViewModel('ODI');
    assert.equal(odiVm.format, 'ODI');
    assert.ok(odiVm.cells.length > 0);

    const testVm = getPressureMapViewModel('Test');
    assert.equal(testVm.format, 'Test');
    assert.ok(testVm.warningLabel.includes('TEST') || testVm.warningLabel.includes('Test'));

    const clutchVm = getClutchViewModel('ODI');
    assert.equal(clutchVm.status, 'calibration-pending');
    assert.equal(clutchVm.scoreDisplay, 'CALIBRATION PENDING');
  });

  await t.test('Integration 6: Match-Level Reconciliation and DNB Separation Recorded', () => {
    assert.ok(fs.existsSync(MATCH_REC_PATH), 'Match-level reconciliation must exist');
    const rows = JSON.parse(fs.readFileSync(MATCH_REC_PATH, 'utf8'));
    assert.ok(rows.length > 0, 'Match reconciliation rows must be > 0');

    const battedRows = rows.filter((r) => r.batted);
    const dnbRows = rows.filter((r) => r.dnb);

    assert.ok(battedRows.length > 0, 'Must have batted rows');
    assert.ok(dnbRows.length > 0, 'Must have DNB rows');
    assert.equal(battedRows.length + dnbRows.length, rows.length);
  });

  await t.test('Integration 7: Artifact byte-for-byte synchronization', () => {
    const dataBytes = fs.readFileSync(DERIVED_ARTIFACT_PATH);
    const srcBytes = fs.readFileSync(SRC_ARTIFACT_PATH);
    assert.ok(dataBytes.equals(srcBytes), 'data/derived and src/data/derived artifacts must be byte-for-byte identical');
  });

  await t.test('Integration 8: Independent Oracle Check on Live Cricsheet Archive Matches', () => {
    const tempOracleDir = path.join(ROOT_DIR, 'data', 'raw', '.oracle_check_temp');
    fs.mkdirSync(tempOracleDir + '/odi', { recursive: true });
    fs.mkdirSync(tempOracleDir + '/t20', { recursive: true });

    try {
      execSync(`tar -xf "${path.join(ROOT_DIR, 'data', 'raw', 'odis_male_json.zip')}" -C "${tempOracleDir}/odi"`, { stdio: 'pipe' });
      execSync(`tar -xf "${path.join(ROOT_DIR, 'data', 'raw', 't20s_male_json.zip')}" -C "${tempOracleDir}/t20"`, { stdio: 'pipe' });

      // Oracle 1: Hobart 2012 (518966.json) -> 133* off 86 balls (16 fours, 2 sixes, not out)
      const hobartRaw = JSON.parse(fs.readFileSync(path.join(tempOracleDir, 'odi', '518966.json'), 'utf8'));
      const hobartParsed = parseCricsheetMatch('518966', hobartRaw);
      assert.ok(hobartParsed.match !== null);
      let hobartRuns = 0, hobartBalls = 0, hobart4s = 0, hobart6s = 0, hobartOut = false;
      for (const inn of hobartParsed.match.innings) {
        for (const del of inn.deliveries) {
          if (del.batter === 'Virat Kohli') {
            hobartRuns += del.batterRuns;
            if (del.batterRuns === 4) hobart4s++;
            if (del.batterRuns === 6) hobart6s++;
            if (!del.extras.wides) hobartBalls++;
          }
          if (del.wicket && del.wicket.playerDismissed === 'Virat Kohli') {
            hobartOut = true;
          }
        }
      }
      assert.equal(hobartRuns, 133, 'Hobart runs must equal 133');
      assert.equal(hobartBalls, 86, 'Hobart balls faced must equal 86');
      assert.equal(hobart4s, 16, 'Hobart fours must equal 16');
      assert.equal(hobart6s, 2, 'Hobart sixes must equal 2');
      assert.equal(hobartOut, false, 'Hobart innings must be not out');

      // Oracle 2: Mirpur 2012 (535798.json) -> 183 off 148 balls (22 fours, 2 sixes, caught)
      const mirpurRaw = JSON.parse(fs.readFileSync(path.join(tempOracleDir, 'odi', '535798.json'), 'utf8'));
      const mirpurParsed = parseCricsheetMatch('535798', mirpurRaw);
      assert.ok(mirpurParsed.match !== null);
      let mirpurRuns = 0, mirpurBalls = 0, mirpur4s = 0, mirpur6s = 0, mirpurOut = false;
      for (const inn of mirpurParsed.match.innings) {
        for (const del of inn.deliveries) {
          if (del.batter === 'Virat Kohli') {
            mirpurRuns += del.batterRuns;
            if (del.batterRuns === 4 && !del.nonBoundary) mirpur4s++;
            if (del.batterRuns === 6 && !del.nonBoundary) mirpur6s++;
            if (!del.extras.wides) mirpurBalls++;
          }
          if (del.wicket && del.wicket.playerDismissed === 'Virat Kohli') {
            mirpurOut = true;
          }
        }
      }
      assert.equal(mirpurRuns, 183, 'Mirpur runs must equal 183');
      assert.equal(mirpurBalls, 148, 'Mirpur balls faced must equal 148');
      assert.equal(mirpur4s, 22, 'Mirpur fours must equal 22');
      assert.equal(mirpur6s, 1, 'Mirpur sixes must equal 1');
      assert.equal(mirpurOut, true, 'Mirpur innings was dismissed');

      // Oracle 3: Melbourne 2022 (1298150.json) -> 82* off 53 balls (6 fours, 4 sixes, not out)
      const mcgRaw = JSON.parse(fs.readFileSync(path.join(tempOracleDir, 't20', '1298150.json'), 'utf8'));
      const mcgParsed = parseCricsheetMatch('1298150', mcgRaw);
      assert.ok(mcgParsed.match !== null);
      let mcgRuns = 0, mcgBalls = 0, mcg4s = 0, mcg6s = 0, mcgOut = false;
      for (const inn of mcgParsed.match.innings) {
        for (const del of inn.deliveries) {
          if (del.batter === 'Virat Kohli') {
            mcgRuns += del.batterRuns;
            if (del.batterRuns === 4) mcg4s++;
            if (del.batterRuns === 6) mcg6s++;
            if (!del.extras.wides) mcgBalls++;
          }
          if (del.wicket && del.wicket.playerDismissed === 'Virat Kohli') {
            mcgOut = true;
          }
        }
      }
      assert.equal(mcgRuns, 82, 'MCG 2022 runs must equal 82');
      assert.equal(mcgBalls, 53, 'MCG 2022 balls faced must equal 53');
      assert.equal(mcg4s, 6, 'MCG 2022 fours must equal 6');
      assert.equal(mcg6s, 4, 'MCG 2022 sixes must equal 4');
      assert.equal(mcgOut, false, 'MCG 2022 innings was not out');

    } finally {
      fs.rmSync(tempOracleDir, { recursive: true, force: true });
    }
  });

  await t.test('Integration 9: Versioned Scorecard Oracles Fixture Verification', () => {
    assert.ok(fs.existsSync(ORACLES_PATH), 'Oracle fixture file must exist');
    const oracleFixtures = JSON.parse(fs.readFileSync(ORACLES_PATH, 'utf8'));
    assert.equal(oracleFixtures.oracles.length, 10, 'Must have exactly 10 oracle fixtures');

    const recReport = JSON.parse(fs.readFileSync(REC_REPORT_PATH, 'utf8'));
    assert.ok(recReport.independentScorecardChecks.length === 10);

    for (const check of recReport.independentScorecardChecks) {
      assert.equal(check.passed, true, `Oracle check ${check.checkId} must pass`);
      assert.ok(check.scorecardUrl.startsWith('https://www.espncricinfo.com/'), `Must have ESPNcricinfo scorecard URL`);
    }
  });

  await t.test('Integration 10: Abandoned/No-Result Match Disaggregation (Match 1388394)', () => {
    const oracleFixtures = JSON.parse(fs.readFileSync(ORACLES_PATH, 'utf8'));
    const sc10 = oracleFixtures.oracles.find((o) => o.checkId === 'SC-10');
    assert.ok(sc10, 'SC-10 fixture must exist');

    assert.equal(sc10.expected.inningsCompletionState, 'all-out', 'Innings completion state must be all-out');
    assert.equal(sc10.expected.matchResultState, 'no-result', 'Match result state must be no-result');
    assert.equal(sc10.expected.analyticsInclusionDecision, 'included-in-career-excluded-from-chase', 'Analytics inclusion decision must be explicit');
  });

  await t.test('Integration 11: Comprehensive Mathematical Invariants & Reconstructed Totals', () => {
    assert.ok(fs.existsSync(MISSING_MATCHES_PATH), 'Missing matches fixture file must exist');
    const missingFixtures = JSON.parse(fs.readFileSync(MISSING_MATCHES_PATH, 'utf8'));
    const recReport = JSON.parse(fs.readFileSync(REC_REPORT_PATH, 'utf8'));
    const matchRows = JSON.parse(fs.readFileSync(MATCH_REC_PATH, 'utf8'));

    for (const fmt of ['ODI', 'T20I']) {
      const rec = recReport.formatsReconciliation[fmt];
      assert.ok(rec, `Format ${fmt} must exist in reconciliation report`);
      const ref = rec.referenceAggregates;
      const derived = rec.derivedTotals;
      const missingList = missingFixtures.formats[fmt].missingMatches;
      const fmtMatchRows = matchRows.filter((r) => r.format === fmt);

      // Invariant 1: Match and Innings Invariants on Derived Rows
      assert.equal(
        fmtMatchRows.length,
        fmtMatchRows.filter((r) => r.batted).length + fmtMatchRows.filter((r) => r.dnb).length,
        `[${fmt}] matches must equal battedMatches + dnbAppearances`
      );
      assert.equal(
        derived.inningsBatted,
        fmtMatchRows.filter((r) => r.batted).length,
        `[${fmt}] derived innings must equal count(records where batted === true)`
      );

      // Invariant 2: Dismissal Invariant (dismissals === innings - notOuts) across ALL subsets
      assert.equal(
        derived.dismissals,
        derived.inningsBatted - derived.notOuts,
        `[${fmt}] Derived dismissals (${derived.dismissals}) must strictly equal innings (${derived.inningsBatted}) - notOuts (${derived.notOuts})`
      );

      const missingBatted = missingList.filter((m) => m.batted);
      const missingNotOuts = missingList.reduce((s, m) => s + (m.notOuts || 0), 0);
      const missingDismissals = missingList.reduce((s, m) => s + (m.dismissals || 0), 0);
      assert.equal(
        missingDismissals,
        missingBatted.length - missingNotOuts,
        `[${fmt}] Missing matches dismissals (${missingDismissals}) must equal missing innings (${missingBatted.length}) - missing notOuts (${missingNotOuts})`
      );

      const reconstructedInnings = derived.inningsBatted + missingBatted.length;
      const reconstructedNotOuts = derived.notOuts + missingNotOuts;
      const reconstructedDismissals = derived.dismissals + missingDismissals;
      assert.equal(
        reconstructedDismissals,
        reconstructedInnings - reconstructedNotOuts,
        `[${fmt}] Reconstructed dismissals must strictly equal reconstructed innings - reconstructed notOuts`
      );
      assert.equal(
        ref.dismissals,
        ref.innings - ref.notOuts,
        `[${fmt}] Reference dismissals must strictly equal reference innings - reference notOuts`
      );

      // Invariant 3: Milestone & Sum Invariants on Missing Matches
      assert.equal(
        missingList.reduce((s, m) => s + (m.centuries || 0), 0),
        missingBatted.filter((m) => m.runs >= 100).length,
        `[${fmt}] Missing centuries must equal count of scores >= 100`
      );
      assert.equal(
        missingList.reduce((s, m) => s + (m.fifties || 0), 0),
        missingBatted.filter((m) => m.runs >= 50 && m.runs < 100).length,
        `[${fmt}] Missing fifties must equal count of 50 <= scores < 100`
      );
      assert.equal(
        missingList.reduce((s, m) => s + (m.ducks || 0), 0),
        missingBatted.filter((m) => m.runs === 0 && m.dismissals === 1).length,
        `[${fmt}] Missing ducks must equal count of 0 runs with dismissal`
      );

      // Invariant 4: No zero-ball non-dismissal batted innings
      for (const m of missingList) {
        if (m.batted && m.ballsFaced === 0) {
          assert.equal(m.dismissals, 1, `[${fmt}] Match ${m.matchId}: Zero-ball batted innings is only valid if a dismissal occurred (diamond duck)`);
        }
        if (m.dnb) {
          assert.equal(m.includedInBattingAggregates, false, `[${fmt}] Match ${m.matchId}: DNB match must have includedInBattingAggregates: false`);
        }
        if (m.officialPlayerAppearance === false) {
          assert.equal(m.countsTowardCareerMatches, false, `[${fmt}] Match ${m.matchId}: Abandoned/no-toss match without appearance must not count toward career matches`);
        }
      }

      // Invariant 5: Equation Integrity from ledger sums
      for (const item of rec.metricsLedger) {
        assert.equal(item.isEquationBalanced, true, `[${fmt}] Equation for ${item.metric} must be balanced`);
        assert.equal(item.status, 'resolved-reconciled', `[${fmt}] Status for ${item.metric} must be resolved-reconciled`);
      }
    }

    assert.equal(recReport.categorizedMatchAccounting.unresolvedDiscrepancy.count, 0, 'Zero unresolved discrepancies');
  });

  await t.test('Integration 12: Markdown Report Snapshot & Generator Synchronization', () => {
    const reportMdPath = path.join(ROOT_DIR, 'data', 'derived', 'reconciliation-report.md');
    assert.ok(fs.existsSync(reportMdPath), 'data/derived/reconciliation-report.md must exist');
    const reportMd = fs.readFileSync(reportMdPath, 'utf8');
    const recReport = JSON.parse(fs.readFileSync(REC_REPORT_PATH, 'utf8'));

    // Verify all metrics and equations in markdown match JSON artifact values
    for (const fmt of ['ODI', 'T20I']) {
      const rec = recReport.formatsReconciliation[fmt];
      for (const item of rec.metricsLedger) {
        assert.ok(
          reportMd.includes(String(item.referenceTarget)),
          `Markdown report must contain target value ${item.referenceTarget} for [${fmt}] ${item.metric}`
        );
        assert.ok(
          reportMd.includes(String(item.includedArchive)),
          `Markdown report must contain derived archive value ${item.includedArchive} for [${fmt}] ${item.metric}`
        );
      }
    }
  });

  await t.test('Integration 13: Scoped Trust Architecture and Explicit Coverage Metadata Audit', () => {
    assert.ok(artifact.trust, 'Artifact must have scoped trust object');
    assert.equal(artifact.trust.careerAggregates.isTrusted, true, 'careerAggregates.isTrusted must be true');
    assert.equal(artifact.trust.careerAggregates.status, 'verified', 'careerAggregates.status must be verified');
    assert.equal(artifact.trust.archiveDeliveries.isTrusted, true, 'archiveDeliveries.isTrusted must be true');
    assert.equal(artifact.trust.archiveDeliveries.completeness, 'partial', 'archiveDeliveries.completeness must be partial');
    assert.equal(artifact.trust.pressureAnalytics.isTrusted, true, 'pressureAnalytics.isTrusted must be true for archive scope in Phase 4');
    assert.equal(artifact.trust.pressureAnalytics.status, 'production-data-partial-coverage');
    assert.equal(artifact.trust.clutchIndex.isTrusted, false, 'clutchIndex.isTrusted must be false');
    assert.equal(artifact.trust.clutchIndex.status, 'calibration-pending', 'clutchIndex.status must be calibration-pending');

    assert.ok(artifact.coverage, 'Artifact must have coverage metadata');
    assert.equal(artifact.coverage.referenceMatches, 439);
    assert.equal(artifact.coverage.archiveMatches, 429);
    assert.equal(artifact.coverage.missingMatches, 10);
    assert.equal(artifact.coverage.matchCoveragePercent, 97.72);

    assert.equal(artifact.coverage.referenceBattingInnings, 419);
    assert.equal(artifact.coverage.archiveBattingInnings, 412);
    assert.equal(artifact.coverage.missingBattingInnings, 7);
    assert.equal(artifact.coverage.inningsCoveragePercent, 98.33);

    // Format specific coverage
    assert.equal(artifact.coverage.formats.ODI.referenceMatches, 314);
    assert.equal(artifact.coverage.formats.ODI.archiveMatches, 311);
    assert.equal(artifact.coverage.formats.ODI.missingMatches, 3);
    assert.equal(artifact.coverage.formats.ODI.referenceInnings, 302);
    assert.equal(artifact.coverage.formats.ODI.archiveInnings, 300);
    assert.equal(artifact.coverage.formats.ODI.missingInnings, 2);

    assert.equal(artifact.coverage.formats.T20I.referenceMatches, 125);
    assert.equal(artifact.coverage.formats.T20I.archiveMatches, 118);
    assert.equal(artifact.coverage.formats.T20I.missingMatches, 7);
    assert.equal(artifact.coverage.formats.T20I.referenceInnings, 117);
    assert.equal(artifact.coverage.formats.T20I.archiveInnings, 112);
    assert.equal(artifact.coverage.formats.T20I.missingInnings, 5);
  });

  await t.test('Integration 14: Scorecard-Only Reconstructed Fixture Delivery Isolation Audit', () => {
    const missingFixtures = JSON.parse(fs.readFileSync(MISSING_MATCHES_PATH, 'utf8'));
    const allMissing = [
      ...(missingFixtures.formats.ODI?.missingMatches || []),
      ...(missingFixtures.formats.T20I?.missingMatches || []),
    ];
    assert.equal(allMissing.length, 11, 'Total missing match fixtures in catalog (10 official + 1 abandoned no-toss)');

    const officialMissing = allMissing.filter((m) => m.officialPlayerAppearance);
    assert.equal(officialMissing.length, 10, 'Must have exactly 10 official missing matches');

    // 1. Assert scorecard fixtures contain zero delivery objects or situational model properties
    for (const m of allMissing) {
      assert.equal(m.deliveries, undefined, `Missing match ${m.matchId} must not contain deliveries array`);
      assert.equal(m.phase, undefined, `Missing match ${m.matchId} must not contain phase property`);
      assert.equal(m.rrrBand, undefined, `Missing match ${m.matchId} must not contain rrrBand property`);
      assert.equal(m.pressureLevel, undefined, `Missing match ${m.matchId} must not contain pressureLevel property`);
      assert.equal(m.dotBalls, undefined, `Missing match ${m.matchId} must not contain dotBalls property`);
    }

    // 2. Assert normalized match collection contains zero matches from missing fixture list
    const normalizedMatches = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'normalized', 'kohli-matches.json'), 'utf8'));
    for (const m of allMissing) {
      const found = normalizedMatches.find((nm) => nm.matchId === m.matchId);
      assert.equal(found, undefined, `Missing match ${m.matchId} must not exist in normalized matches collection`);
    }

    // 3. Assert total deliveries in normalized matches come exclusively from 429 archive matches
    assert.equal(normalizedMatches.length, 429);
    let totalNormalizedDeliveries = 0;
    for (const nm of normalizedMatches) {
      for (const inn of nm.innings) {
        totalNormalizedDeliveries += inn.deliveries.length;
      }
    }
    assert.ok(totalNormalizedDeliveries > 0, 'Normalized deliveries must be positive');

    // 4. Assert missing matches cannot unlock Clutch Index
    assert.equal(artifact.clutchIndex.status, 'calibration-pending');
    assert.equal(artifact.clutchIndex.score, null);
    assert.equal(artifact.trust.clutchIndex.isTrusted, false);
  });

  await t.test('Integration 15: Pressure Map 15-Cell Completeness and Sample-Size Bands', () => {
    for (const fmt of ['ODI', 'T20I']) {
      const grid = artifact.pressureMap[fmt];
      assert.equal(grid.cells.length, 15, `${fmt} pressure map must contain exactly 15 cells`);
      for (const cell of grid.cells) {
        assert.ok(['insufficient', 'limited', 'usable', 'strong'].includes(cell.sampleSizeBand));
        assert.ok(cell.sampleSize.ballsFaced >= 0);
        assert.ok(cell.sampleSize.inningsCount >= 0);
      }
    }
  });

  await t.test('Integration 16: Chase Analytics Present for ODI, T20I, and Overall', () => {
    assert.ok(artifact.chaseMetrics.ODI, 'ODI chase metrics must exist');
    assert.ok(artifact.chaseMetrics.T20I, 'T20I chase metrics must exist');
    assert.ok(artifact.chaseMetrics.overall, 'Overall chase metrics must exist');

    assert.equal(artifact.chaseMetrics.ODI.inningsCount, 165);
    assert.equal(artifact.chaseMetrics.ODI.runs, 8444);
    assert.equal(artifact.chaseMetrics.T20I.inningsCount, 47);
    assert.equal(artifact.chaseMetrics.T20I.runs, 1984);
  });

  await t.test('Integration 17: Production Provenance Metadata Audit', () => {
    assert.ok(artifact.provenance, 'Artifact must have provenance metadata');
    assert.equal(artifact.provenance.parserVersion, '4.0.0');
    assert.equal(artifact.provenance.modelVersion, '5-band-rrr-v2');
    assert.equal(artifact.provenance.matchCounts.totalArchiveMatches, 429);
    assert.equal(artifact.provenance.matchCounts.referenceMatches, 439);
    assert.equal(artifact.provenance.matchCounts.unavailableMatches, 10);
    assert.equal(artifact.provenance.inningsCounts.totalArchiveInnings, 412);
    assert.equal(artifact.provenance.inningsCounts.referenceInnings, 419);
    assert.equal(artifact.provenance.inningsCounts.unavailableInnings, 7);
  });

  await t.test('Integration 18: Pressure Map View-Model Native 5-Level Preserved', () => {
    const odiVm = getPressureMapViewModel('ODI');
    assert.equal(odiVm.cells.length, 15);
    assert.equal(odiVm.isDerived, true);
    const levels = new Set(odiVm.cells.map((c) => c.pressureLevel));
    assert.ok(levels.has('comfortable'));
    assert.ok(levels.has('moderate'));
    assert.ok(levels.has('stiff'));
    assert.ok(levels.has('severe'));
    assert.ok(levels.has('extreme'));
  });

  await t.test('Integration 19: Chase View-Model Wires Production Artifact Data', () => {
    const odiChase = getChaseAnalyticsViewModel('ODI');

    assert.equal(odiChase.isDerived, true);
    assert.equal(odiChase.inningsCount, 165);
    assert.equal(odiChase.runs, 8444);
    assert.equal(odiChase.average, 64.95);
    assert.equal(odiChase.successfulChaseAverage, 88.29);

    const t20iChase = getChaseAnalyticsViewModel('T20I');
    assert.equal(t20iChase.isDerived, true);
    assert.equal(t20iChase.inningsCount, 47);
    assert.equal(t20iChase.runs, 1984);
    assert.equal(t20iChase.average, 68.41);
    assert.equal(t20iChase.successfulChaseAverage, 81.1);
  });

  await t.test('Integration 20: Clutch Index Strict Calibration-Pending Preservation', () => {
    assert.equal(artifact.clutchIndex.status, 'calibration-pending');
    assert.equal(artifact.clutchIndex.score, null);
    assert.equal(artifact.trust.clutchIndex.isTrusted, false);
    assert.equal(artifact.trust.clutchIndex.status, 'calibration-pending');
  });

  await t.test('Integration 21: Report-to-Artifact Full Synchronization Audit', () => {
    const reportMdPath = path.join(ROOT_DIR, 'data', 'derived', 'reconciliation-report.md');
    assert.ok(fs.existsSync(reportMdPath), 'Markdown report must exist');
    const reportMd = fs.readFileSync(reportMdPath, 'utf8');

    // Population A, B, C counts must appear in markdown report
    assert.ok(reportMd.includes('Population A (Batting Chases)'));
    assert.ok(reportMd.includes('Population B (Completed Outcomes)'));
    assert.ok(reportMd.includes('Population C (Pressure Deliveries)'));

    // Invariant numbers must appear in markdown
    assert.ok(reportMd.includes('8984'));
    assert.ok(reportMd.includes('9165'));
    assert.ok(reportMd.includes('8964'));
    assert.ok(reportMd.includes('1459'));
    assert.ok(reportMd.includes('1502'));
    assert.ok(reportMd.includes('1448'));

    // Check target recovery matches in markdown
    assert.ok(reportMd.includes('682921'));
    assert.ok(reportMd.includes('682929'));
    assert.ok(reportMd.includes('682943'));
  });

  await t.test('Integration 22: Distinct Denominator & 15-Cell Cross-Sum Invariant Audit', () => {
    for (const fmt of ['ODI', 'T20I']) {
      const pm = artifact.pressureMap[fmt];
      const pop = artifact.analyticalPopulations[fmt].pressurePopulation;

      assert.equal(pm.cells.length, 15, `${fmt} must have 15 cells`);
      const sumLegal = pm.cells.reduce((s, c) => s + (c.teamLegalDeliveries ?? c.sampleSize.teamLegalDeliveries ?? 0), 0);
      const sumOfficial = pm.cells.reduce((s, c) => s + (c.officialBatterBallsFaced ?? c.sampleSize.ballsFaced), 0);
      const sumRuns = pm.cells.reduce((s, c) => s + c.runs, 0);
      const sumDismissals = pm.cells.reduce((s, c) => s + c.dismissals, 0);
      const sumFours = pm.cells.reduce((s, c) => s + c.fours, 0);
      const sumSixes = pm.cells.reduce((s, c) => s + c.sixes, 0);

      assert.equal(sumLegal, pop.teamLegalDeliveries, `${fmt} legal deliveries cross-sum`);
      assert.equal(sumOfficial, pop.officialBatterBallsFaced, `${fmt} official balls faced cross-sum`);
      assert.equal(sumRuns, pop.runs, `${fmt} runs cross-sum`);
      assert.equal(sumDismissals, pop.dismissals, `${fmt} dismissals cross-sum`);
      assert.equal(sumFours, pop.fours, `${fmt} fours cross-sum`);
      assert.equal(sumSixes, pop.sixes, `${fmt} sixes cross-sum`);
    }
  });

  await t.test('Integration 23: UI View Model & Metric Labels Preservation', () => {
    for (const fmt of ['ODI', 'T20I']) {
      const vm = getPressureMapViewModel(fmt);
      assert.equal(vm.cells.length, 15);
      for (const c of vm.cells) {
        assert.ok(c.ballsFaced !== undefined, 'ballsFaced must be defined');
        assert.ok(c.officialBatterBallsFaced !== undefined, 'officialBatterBallsFaced must be defined');
        assert.ok(c.teamLegalDeliveries !== undefined, 'teamLegalDeliveries must be defined');
        assert.ok(c.strikeRate !== undefined, 'strikeRate must be defined');
        assert.ok(c.battingStrikeRate !== undefined, 'battingStrikeRate must be defined');
      }
    }
  });

  await t.test('Integration 24: Zero-Dismissal Batting Average Semantics Audit (All 30 Cells)', () => {
    for (const fmt of ['ODI', 'T20I']) {
      const pm = artifact.pressureMap[fmt];
      assert.equal(pm.cells.length, 15, `${fmt} must have 15 cells`);
      for (const c of pm.cells) {
        if (c.dismissals === 0) {
          assert.equal(
            c.average,
            null,
            `[${fmt}] Cell ${c.phase} / ${c.rrrBand} with 0 dismissals (${c.runs} runs) must have average === null, got ${c.average}`
          );
        } else {
          const expectedAvg = Number((c.runs / c.dismissals).toFixed(2));
          assert.equal(
            c.average,
            expectedAvg,
            `[${fmt}] Cell ${c.phase} / ${c.rrrBand} with ${c.dismissals} dismissals (${c.runs} runs) must have average === ${expectedAvg}, got ${c.average}`
          );
        }
      }
    }
  });
});



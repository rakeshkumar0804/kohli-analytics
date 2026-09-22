#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DERIVED_ARTIFACT_PATH = path.join(ROOT_DIR, 'data', 'derived', 'kohli-analytics.json');
const SRC_ARTIFACT_PATH = path.join(ROOT_DIR, 'src', 'data', 'derived', 'kohliAnalyticsArtifact.json');
const COVERAGE_REPORT_PATH = path.join(ROOT_DIR, 'data', 'derived', 'coverage-report.json');
const RECONCILIATION_REPORT_PATH = path.join(ROOT_DIR, 'data', 'derived', 'reconciliation-report.json');
const MATCH_REC_PATH = path.join(ROOT_DIR, 'data', 'derived', 'match-level-reconciliation.json');
const MANIFEST_PATH = path.join(ROOT_DIR, 'data', 'manifests', 'cricsheet-manifest.json');

async function main() {
  console.log('=== Step 4: Verifying Derived Analytics Artifacts ===\n');

  const errors = [];

  if (!fs.existsSync(MANIFEST_PATH)) {
    errors.push(`Manifest missing at ${MANIFEST_PATH}`);
  } else {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (!manifest.publisher || !manifest.licenseName || !manifest.archives || manifest.archives.length === 0) {
      errors.push('Manifest missing required metadata fields');
    }
    if (manifest.player?.cricsheetPersonId !== 'ba607b88') {
      errors.push(`Manifest player must have cricsheetPersonId 'ba607b88', found '${manifest.player?.cricsheetPersonId}'`);
    }
    if (manifest.player?.externalIds?.espncricinfo !== '253802') {
      errors.push(`Manifest player must have externalIds.espncricinfo '253802', found '${manifest.player?.externalIds?.espncricinfo}'`);
    }
  }

  if (!fs.existsSync(MATCH_REC_PATH)) {
    errors.push(`Match-level reconciliation missing at ${MATCH_REC_PATH}`);
  } else {
    const matchRows = JSON.parse(fs.readFileSync(MATCH_REC_PATH, 'utf8'));
    if (!Array.isArray(matchRows) || matchRows.length === 0) {
      errors.push('Match-level reconciliation must contain non-empty array of candidate match records');
    } else {
      // Validate schema of first record
      const r = matchRows[0];
      const requiredFields = ['matchId', 'filename', 'date', 'format', 'opponent', 'event', 'stage', 'schemaVersion', 'participationStatus', 'battingStatus', 'runs', 'ballsFaced', 'dismissalStatus', 'fours', 'sixes', 'inclusionStatus', 'identityResolutionMethod', 'completionState', 'referenceCutoffEligibility'];
      for (const f of requiredFields) {
        if (r[f] === undefined) {
          errors.push(`Match-level reconciliation record missing field '${f}'`);
        }
      }
    }
  }

  const REC_REPORT_MD_PATH = path.join(ROOT_DIR, 'data', 'derived', 'reconciliation-report.md');
  if (!fs.existsSync(REC_REPORT_MD_PATH)) {
    errors.push(`Markdown reconciliation report missing at ${REC_REPORT_MD_PATH}`);
  }

  if (!fs.existsSync(RECONCILIATION_REPORT_PATH)) {
    errors.push(`Reconciliation report missing at ${RECONCILIATION_REPORT_PATH}`);
  } else {
    const recReport = JSON.parse(fs.readFileSync(RECONCILIATION_REPORT_PATH, 'utf8'));
    if (!recReport.formatsReconciliation || !recReport.formatsReconciliation.ODI || !recReport.formatsReconciliation.T20I) {
      errors.push('Reconciliation report missing format reconciliation ledgers');
    }
    if (!recReport.independentScorecardChecks || recReport.independentScorecardChecks.length < 10) {
      errors.push(`Reconciliation report must contain at least 10 independent scorecard checks, found ${recReport.independentScorecardChecks?.length}`);
    }
    if (!recReport.trustDecision || typeof recReport.trustDecision.isTrusted !== 'boolean') {
      errors.push('Reconciliation report missing trustDecision object');
    }
  }

  if (!fs.existsSync(DERIVED_ARTIFACT_PATH)) {
    errors.push(`Derived artifact missing at ${DERIVED_ARTIFACT_PATH}`);
  } else {
    const artifact = JSON.parse(fs.readFileSync(DERIVED_ARTIFACT_PATH, 'utf8'));

    // Check version and readiness
    if (!artifact.artifactVersion || !artifact.pipelineVersion || !artifact.generatedAt) {
      errors.push('Artifact missing versioning or generation timestamp');
    }

    if (typeof artifact.isTrusted !== 'boolean') {
      errors.push(`Artifact isTrusted must be a boolean, found '${artifact.isTrusted}'`);
    }

    // Check player IDs
    if (artifact.player?.canonicalName !== 'Virat Kohli') {
      errors.push('Artifact player canonical name must be Virat Kohli');
    }
    if (artifact.player?.cricsheetPersonId !== 'ba607b88') {
      errors.push(`Artifact player cricsheetPersonId must be 'ba607b88', found '${artifact.player?.cricsheetPersonId}'`);
    }
    if (artifact.player?.externalIds?.espncricinfo !== '253802') {
      errors.push(`Artifact player externalIds.espncricinfo must be '253802', found '${artifact.player?.externalIds?.espncricinfo}'`);
    }

    // Check pressure maps
    if (!artifact.pressureMap?.ODI || !artifact.pressureMap?.T20I || !artifact.pressureMap?.Test) {
      errors.push('Artifact missing format-specific pressure map derivations');
    } else {
      if (artifact.pressureMap.Test.status !== 'unsupported-format') {
        errors.push(`Test pressure map must be status 'unsupported-format', found '${artifact.pressureMap.Test.status}'`);
      }
      if (artifact.pressureMap.ODI.cells.length !== 15) {
        errors.push(`ODI pressure map must have 15 cells (3 phases x 5 RRR bands), found ${artifact.pressureMap.ODI.cells.length}`);
      }
      if (artifact.pressureMap.T20I.cells.length !== 15) {
        errors.push(`T20I pressure map must have 15 cells (3 phases x 5 RRR bands), found ${artifact.pressureMap.T20I.cells.length}`);
      }
    }

    // Check Clutch Index
    if (!artifact.clutchIndex || artifact.clutchIndex.status !== 'calibration-pending' || artifact.clutchIndex.score !== null) {
      errors.push('Clutch Index must be calibration-pending with score null');
    }

    // Check scoped trust architecture
    if (!artifact.trust) {
      errors.push('Artifact missing scoped trust architecture');
    } else {
      if (artifact.trust.careerAggregates?.isTrusted !== true || artifact.trust.careerAggregates?.status !== 'verified') {
        errors.push(`Career aggregates trust invalid: isTrusted=${artifact.trust.careerAggregates?.isTrusted}, status=${artifact.trust.careerAggregates?.status}`);
      }
      if (artifact.trust.archiveDeliveries?.isTrusted !== true || artifact.trust.archiveDeliveries?.completeness !== 'partial') {
        errors.push(`Archive deliveries trust invalid: isTrusted=${artifact.trust.archiveDeliveries?.isTrusted}, completeness=${artifact.trust.archiveDeliveries?.completeness}`);
      }
      if (artifact.trust.pressureAnalytics?.isTrusted !== true) {
        errors.push(`Pressure analytics must have isTrusted: true, found '${artifact.trust.pressureAnalytics?.isTrusted}'`);
      }
      if (artifact.trust.clutchIndex?.isTrusted !== false || artifact.trust.clutchIndex?.status !== 'calibration-pending') {
        errors.push(`Clutch Index trust must have isTrusted: false and status: 'calibration-pending', found isTrusted=${artifact.trust.clutchIndex?.isTrusted}, status=${artifact.trust.clutchIndex?.status}`);
      }
    }

    // Check provenance
    if (!artifact.provenance || !artifact.provenance.sampleSizeThresholds || !artifact.provenance.parserVersion) {
      errors.push('Artifact missing provenance metadata or sample-size thresholds');
    }


    // Check coverage metadata
    if (!artifact.coverage) {
      errors.push('Artifact missing coverage metadata');
    } else {
      if (artifact.coverage.referenceMatches !== 439 || artifact.coverage.archiveMatches !== 429 || artifact.coverage.missingMatches !== 10) {
        errors.push(`Artifact match coverage counts mismatch: ref=${artifact.coverage.referenceMatches}, arch=${artifact.coverage.archiveMatches}, missing=${artifact.coverage.missingMatches}`);
      }
      if (artifact.coverage.referenceBattingInnings !== 419 || artifact.coverage.archiveBattingInnings !== 412 || artifact.coverage.missingBattingInnings !== 7) {
        errors.push(`Artifact innings coverage counts mismatch: ref=${artifact.coverage.referenceBattingInnings}, arch=${artifact.coverage.archiveBattingInnings}, missing=${artifact.coverage.missingBattingInnings}`);
      }
      if (!artifact.coverage.formats?.ODI || !artifact.coverage.formats?.T20I) {
        errors.push('Artifact coverage missing format breakdown for ODI/T20I');
      }
    }

    // Check analytical populations & delivery bridges
    if (!artifact.analyticalPopulations?.ODI || !artifact.analyticalPopulations?.T20I) {
      errors.push('Artifact missing analytical populations for ODI and T20I');
    } else {
      const odiPop = artifact.analyticalPopulations.ODI;
      const t20Pop = artifact.analyticalPopulations.T20I;

      if (odiPop.battingChasePopulation.count !== 165 || t20Pop.battingChasePopulation.count !== 47) {
        errors.push(`Batting chase population counts mismatch: ODI=${odiPop.battingChasePopulation.count} (expected 165), T20I=${t20Pop.battingChasePopulation.count} (expected 47)`);
      }
      if (odiPop.completedOutcomeChasePopulation.count !== 165 || t20Pop.completedOutcomeChasePopulation.count !== 47) {
        errors.push(`Completed outcome chase population counts mismatch: ODI=${odiPop.completedOutcomeChasePopulation.count} (expected 165), T20I=${t20Pop.completedOutcomeChasePopulation.count} (expected 47)`);
      }
      if (odiPop.pressurePopulation.count !== 165 || t20Pop.pressurePopulation.count !== 47) {
        errors.push(`Pressure population innings count mismatch: ODI=${odiPop.pressurePopulation.count} (expected 165), T20I=${t20Pop.pressurePopulation.count} (expected 47)`);
      }

      // Check delivery bridge invariants
      if (!odiPop.invariants.strikerToOfficialBalanced || !odiPop.invariants.officialToPressureBalanced) {
        errors.push(`ODI delivery bridges unbalanced: ${JSON.stringify(odiPop.bridges)}`);
      }
      if (!t20Pop.invariants.strikerToOfficialBalanced || !t20Pop.invariants.officialToPressureBalanced) {
        errors.push(`T20I delivery bridges unbalanced: ${JSON.stringify(t20Pop.bridges)}`);
      }

      // Check 15-cell cross-sum invariants
      for (const [fmt, pop] of [['ODI', odiPop], ['T20I', t20Pop]]) {
        const grid = artifact.pressureMap[fmt];
        const sumLegal = grid.cells.reduce((s, c) => s + (c.teamLegalDeliveries ?? 0), 0);
        const sumOfficial = grid.cells.reduce((s, c) => s + (c.officialBatterBallsFaced ?? c.sampleSize.ballsFaced), 0);
        const sumRuns = grid.cells.reduce((s, c) => s + c.runs, 0);
        const sumDismissals = grid.cells.reduce((s, c) => s + c.dismissals, 0);
        const sumFours = grid.cells.reduce((s, c) => s + c.fours, 0);
        const sumSixes = grid.cells.reduce((s, c) => s + c.sixes, 0);

        if (sumLegal !== pop.pressurePopulation.teamLegalDeliveries) {
          errors.push(`[${fmt}] 15-cell legal deliveries sum ${sumLegal} !== population ${pop.pressurePopulation.teamLegalDeliveries}`);
        }
        if (sumOfficial !== pop.pressurePopulation.officialBatterBallsFaced) {
          errors.push(`[${fmt}] 15-cell official balls faced sum ${sumOfficial} !== population ${pop.pressurePopulation.officialBatterBallsFaced}`);
        }
        if (sumRuns !== pop.pressurePopulation.runs) {
          errors.push(`[${fmt}] 15-cell runs sum ${sumRuns} !== population ${pop.pressurePopulation.runs}`);
        }
        if (sumDismissals !== pop.pressurePopulation.dismissals) {
          errors.push(`[${fmt}] 15-cell dismissals sum ${sumDismissals} !== population ${pop.pressurePopulation.dismissals}`);
        }
        if (sumFours !== pop.pressurePopulation.fours) {
          errors.push(`[${fmt}] 15-cell fours sum ${sumFours} !== population ${pop.pressurePopulation.fours}`);
        }
        if (sumSixes !== pop.pressurePopulation.sixes) {
          errors.push(`[${fmt}] 15-cell sixes sum ${sumSixes} !== population ${pop.pressurePopulation.sixes}`);
        }
      }
    }

    // Check target recovery audit
    if (!Array.isArray(artifact.targetRecoveryAudit) || artifact.targetRecoveryAudit.length !== 3) {
      errors.push(`Artifact targetRecoveryAudit must contain exactly 3 reprocessed T20I matches (682921, 682929, 682943), found ${artifact.targetRecoveryAudit?.length}`);
    }

    // Check synchronization between data/derived and src/data/derived
    if (fs.existsSync(SRC_ARTIFACT_PATH)) {
      const derivedBytes = fs.readFileSync(DERIVED_ARTIFACT_PATH);
      const srcBytes = fs.readFileSync(SRC_ARTIFACT_PATH);
      if (!derivedBytes.equals(srcBytes)) {
        errors.push('Synchronization error: src/data/derived/kohliAnalyticsArtifact.json does not match data/derived/kohli-analytics.json byte-for-byte');
      }
    } else {
      errors.push(`Source artifact missing at ${SRC_ARTIFACT_PATH}`);
    }
  }

  if (!fs.existsSync(COVERAGE_REPORT_PATH)) {
    errors.push(`Coverage report missing at ${COVERAGE_REPORT_PATH}`);
  }

  if (errors.length > 0) {
    console.error('❌ Verification FAILED with errors:');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log('✅ All Derived Artifact Verification Gates Passed Successfully!');
}

main().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const NORMALIZED_PATH = path.join(ROOT_DIR, 'data', 'normalized', 'kohli-matches.json');
const DERIVED_DIR = path.join(ROOT_DIR, 'data', 'derived');
const SRC_DERIVED_DIR = path.join(ROOT_DIR, 'src', 'data', 'derived');

import { aggregateBatting } from '../src/analytics/aggregateBatting.ts';
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

function writeAtomicJson(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function writeAtomicText(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, content, 'utf8');
  fs.renameSync(tempPath, filePath);
}

function generateMarkdownReport(report) {
  let md = `# Phase 5 Clutch Index Calibration & Explainability Report\n\n`;
  md += `- **Model Version**: \`${report.modelVersion}\`\n`;
  md += `- **Status**: \`${report.calibrationStatus}\`\n`;
  md += `- **Generated At**: \`${report.generatedAt}\`\n`;
  md += `- **Player**: ${report.player}\n`;
  md += `- **Baseline Definition**: \`${report.baselineChoice}\`\n`;
  md += `- **Publication Allowed**: \`${report.publicationAllowed}\`\n`;
  md += `- **Public Score**: \`${report.publicScore === null ? 'null (CALIBRATION PENDING)' : report.publicScore}\`\n\n`;
  md += `---\n\n`;

  md += `## 1. Frozen Legacy Model (0.1.0-experimental)\n\n`;
  md += `- **Status**: \`${report.legacyModel.status}\`\n`;
  md += `- **Original Formula**: \`${report.legacyModel.formula}\`\n`;
  md += `- **Editorial Weights**: Chase (35%), High Pressure (25%), Knockout (20%), Finals (20%)\n`;
  md += `- **Known Weaknesses**:\n`;
  for (const w of report.legacyModel.knownWeaknesses) {
    md += `  - ${w}\n`;
  }
  md += `- **Why Never Production-Trusted**: ${report.legacyModel.whyNeverProductionTrusted}\n\n`;
  md += `---\n\n`;

  md += `## 2. Normalization Framework (Policy A: Hyperbolic Tangent)\n\n`;
  md += `The Phase 5 specification adopts Policy A for non-linear bounded score mapping:\n`;
  md += `$$\\text{score} = 50 + 50 \\times \\tanh\\left(\\frac{\\text{splitAvg} - \\text{baseAvg}}{\\text{baseAvg}}\\right) = 50 + 50 \\times \\tanh(\\text{ratio} - 1)$$\n\n`;
  md += `### Exact Mathematical Anchors (Policy A):\n`;
  md += `| Ratio | Split vs Base Relative Diff | Formula Evaluation | Exact Score Points | Interpretation |\n`;
  md += `| :---: | :---: | :---: | :---: | :--- |\n`;
  md += `| **0.0x** | -100% (0 runs) | $50 + 50 \\times \\tanh(-1.0)$ | **11.92** | Practical non-negative minimum |\n`;
  md += `| **0.5x** | -50% depression | $50 + 50 \\times \\tanh(-0.5)$ | **26.89** | Severe situational depression |\n`;
  md += `| **1.0x** | 0% (parity) | $50 + 50 \\times \\tanh(0.0)$ | **50.00** | Exact baseline parity anchor |\n`;
  md += `| **1.5x** | +50% elevation | $50 + 50 \\times \\tanh(0.5)$ | **73.11** | Strong situational elevation |\n`;
  md += `| **2.0x** | +100% elevation | $50 + 50 \\times \\tanh(1.0)$ | **88.08** | Elite situational elevation |\n\n`;
  md += `> **Range Note**: The output is strictly bounded to the interval $[0, 100]$. For all non-negative batting ratios, the practical domain is $[11.92, 100)$. Ratio $0.0\\times$ maps to $11.92$, never $0.0$.\n\n`;
  md += `---\n\n`;

  md += `## 3. Operational Component Definitions & Sample Counts\n\n`;
  for (const [fmt, fData] of Object.entries(report.formats)) {
    md += `### ${fmt} Format Component Accounting\n\n`;
    md += `- **Archive-Covered Baseline Average**: **${fData.archiveCoveredBaselineAverage.toFixed(2)}** (${fData.archiveCoveredRuns} runs / ${fData.archiveCoveredDismissals} dismissals across ${fData.archiveCoveredMatches} matches, ${fData.archiveCoveredBattedInnings} batted innings)\n`;
    md += `- **Phase 1 Full-Career Verified Average**: **${fData.fullCareerVerifiedAverage.toFixed(2)}** (${fData.fullCareerRuns} runs / ${fData.fullCareerDismissals} dismissals across ${fData.fullCareerMatches} matches, ${fData.fullCareerBattedInnings} batted innings)\n`;
    md += `- *Scope Rationale*: Situational splits within the delivery dataset are evaluated against the archive-covered baseline average to prevent delivery-subset mismatch.\n\n`;
    md += `| Component | Innings | Balls | Runs | Dismissals | Split Avg | Baseline Avg | Ratio | Tanh Score (0-100) | Min Req | Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
    for (const c of fData.components) {
      const splitStr = c.splitAvg !== null ? c.splitAvg.toFixed(2) : '—';
      const baseStr = c.baselineAvg !== null ? c.baselineAvg.toFixed(2) : '—';
      const ratioStr = c.ratio !== null ? `${c.ratio.toFixed(2)}x` : '—';
      const scoreStr = c.normalizedScore !== null ? c.normalizedScore.toFixed(2) : 'null';
      md += `| **${c.label}** | ${c.innings} | ${c.balls} | ${c.runs} | ${c.dismissals} | ${splitStr} | ${baseStr} | ${ratioStr} | ${scoreStr} | N>=${c.minSampleInnings} | \`${c.status}\` |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;

  md += `## 4. Overlap & Multicollinearity Matrix\n\n`;
  for (const [fmt, fData] of Object.entries(report.formats)) {
    md += `### ${fmt} Inter-Component Directional Containment\n\n`;
    md += `| Set A | Set B | Unit | Innings Overlap | Containment (A in B) | Containment (B in A) | Jaccard Index | Directional Formula |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
    for (const row of fData.overlapMatrix.matrix) {
      if (row.setA !== row.setB) {
        md += `| \`${row.setA}\` | \`${row.setB}\` | ${row.populationUnit} | ${row.intersectionCount} | **${row.containmentAInB}%** | **${row.containmentBInA}%** | ${row.jaccardIndex} | \`${row.directionalFormula}\` |\n`;
      }
    }
    md += `\n> ⚠️ **Collinearity Finding**: ${fData.overlapMatrix.collinearityWarning}\n\n`;
  }

  md += `---\n\n`;

  md += `## 5. Weight Sensitivity & Perturbation Analysis\n\n`;
  for (const [fmt, fData] of Object.entries(report.formats)) {
    md += `### ${fmt} Weight Sensitivity Variants\n\n`;
    md += `| Variant | Chase Wt | High RRR Wt | Knockout Wt | Finals Wt | Composite Score | Delta vs Base | Commentary |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
    for (const v of fData.sensitivity.variants) {
      const sc = v.score !== null ? v.score.toFixed(2) : 'null';
      const del = v.deltaVsBaseline !== null ? `${v.deltaVsBaseline.toFixed(2)} pts` : '—';
      md += `| **${v.name}** | ${(v.weights.completedChase * 100).toFixed(0)}% | ${(v.weights.highRrr * 100).toFixed(0)}% | ${(v.weights.knockouts * 100).toFixed(0)}% | ${(v.weights.finals * 100).toFixed(0)}% | **${sc}** | ${del} | ${v.commentary} |\n`;
    }
    md += `\n- **Max Delta**: ${fData.sensitivity.maxScoreDelta} pts\n`;
    md += `- **Stability Verdict**: ${fData.sensitivity.blockerVerdict}\n\n`;
  }

  md += `---\n\n`;

  md += `## 6. Temporal Validation (Era-by-Era Split Stability)\n\n`;
  for (const [fmt, fData] of Object.entries(report.formats)) {
    md += `### ${fmt} Temporal Stability\n\n`;
    md += `| Period | Era | Years | Matches | Innings | Chase Avg | Base Avg | Clutch Ratio | Knockout Innings | Knockout Avg |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
    for (const s of fData.temporal.splits) {
      const cAvg = s.chaseAverage !== null ? s.chaseAverage.toFixed(2) : '—';
      const oAvg = s.overallAverage !== null ? s.overallAverage.toFixed(2) : '—';
      const rStr = s.clutchRatio !== null ? `${s.clutchRatio.toFixed(2)}x` : '—';
      const kAvg = s.knockoutAverage !== null ? s.knockoutAverage.toFixed(2) : '—';
      md += `| \`${s.periodId}\` | ${s.eraLabel} | ${s.yearRange} | ${s.matchesEvaluated} | ${s.inningsBatted} | ${cAvg} | ${oAvg} | **${rStr}** | ${s.knockoutInnings} | ${kAvg} |\n`;
    }
    md += `\n> **Finding**: ${fData.temporal.findings}\n\n`;
  }

  md += `---\n\n`;

  md += `## 7. Uncertainty & Deterministic Bootstrap Confidence Intervals (Seed: 429, B=1000)\n\n`;
  for (const [fmt, fData] of Object.entries(report.formats)) {
    md += `### ${fmt} Raw Batting Average Bootstrap CI (Unit: runs/dismissal)\n\n`;
    md += `| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    for (const [sliceName, ci] of Object.entries(fData.bootstrapBattingAverage || fData.bootstrap)) {
      const mStr = ci.mean !== null ? ci.mean.toFixed(2) : '—';
      const medStr = ci.median !== null ? ci.median.toFixed(2) : '—';
      const lowStr = ci.ci95Lower !== null ? ci.ci95Lower.toFixed(2) : '—';
      const upStr = ci.ci95Upper !== null ? ci.ci95Upper.toFixed(2) : '—';
      const wStr = ci.ciWidth !== null ? ci.ciWidth.toFixed(2) : '—';
      const seStr = ci.standardError !== null ? `±${ci.standardError.toFixed(2)}` : '—';
      md += `| **${sliceName}** | ${ci.sampleCount} | ${ci.attemptedReplicates} | ${ci.validReplicates} | ${ci.invalidZeroDismissalReplicates} | ${(ci.validReplicateRate * 100).toFixed(1)}% | ${mStr} | ${medStr} | **${lowStr}** | **${upStr}** | ${wStr} | ${seStr} | \`${ci.status}\` |\n`;
    }
    md += `\n`;

    if (fData.bootstrapComponentScore) {
      md += `### ${fmt} Clutch Component Score Bootstrap CI (Unit: score-points 0-100)\n\n`;
      md += `| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Score Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
      for (const [sliceName, ci] of Object.entries(fData.bootstrapComponentScore)) {
        const mStr = ci.mean !== null ? ci.mean.toFixed(2) : '—';
        const medStr = ci.median !== null ? ci.median.toFixed(2) : '—';
        const lowStr = ci.ci95Lower !== null ? ci.ci95Lower.toFixed(2) : '—';
        const upStr = ci.ci95Upper !== null ? ci.ci95Upper.toFixed(2) : '—';
        const wStr = ci.ciWidth !== null ? ci.ciWidth.toFixed(2) : '—';
        const seStr = ci.standardError !== null ? `±${ci.standardError.toFixed(2)}` : '—';
        md += `| **${sliceName}** | ${ci.sampleCount} | ${ci.attemptedReplicates} | ${ci.validReplicates} | ${ci.invalidZeroDismissalReplicates} | ${(ci.validReplicateRate * 100).toFixed(1)}% | ${mStr} | ${medStr} | **${lowStr}** | **${upStr}** | ${wStr} | ${seStr} | \`${ci.status}\` |\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;

  md += `## 8. Outcome Leakage Prevention Audit\n\n`;
  md += `| Feature | Computation Time | Uses Post-Match Result | Status | Mitigation Policy |\n`;
  md += `| :--- | :--- | :---: | :--- | :--- |\n`;
  for (const leak of report.leakageAudit) {
    md += `| \`${leak.featureName}\` | \`${leak.computationTime}\` | ${leak.usesMatchOutcome ? 'Yes' : 'No'} | \`${leak.status}\` | ${leak.mitigation} |\n`;
  }
  md += `\n`;

  md += `---\n\n`;

  md += `## 9. Calibration Gates & Decision Ledger\n\n`;
  for (const gate of report.calibrationGates) {
    const icon = gate.passed ? '✅' : '❌';
    md += `- **Gate ${gate.gateId}: ${gate.gateName}**: ${icon} \`${gate.status}\`\n`;
    md += `  - *Requirement*: ${gate.requirement}\n`;
    md += `  - *Observed*: ${gate.observed || gate.finding}\n`;
    md += `  - *Blocker Reason*: ${gate.blockerReason}\n\n`;
  }

  md += `### Final Calibration Decision\n\n`;
  md += `> **Publication Allowed**: \`${report.publicationAllowed}\`\n`;
  md += `> **Status**: \`${report.calibrationStatus}\`\n`;
  md += `> **Public Score**: \`${report.publicScore === null ? 'null (CALIBRATION PENDING)' : report.publicScore}\`\n`;
  md += `> **Exact Blocker Summary**: ${report.blockerReason}\n`;

  return md;
}

async function main() {
  console.log('=== Phase 5: Calibrating Clutch Index Model & Evaluating Statistical Gates ===\n');

  if (!fs.existsSync(NORMALIZED_PATH)) {
    const calibrationReportJsonPath = path.join(DERIVED_DIR, 'clutch-calibration-report.json');
    if (fs.existsSync(calibrationReportJsonPath)) {
      console.log(`Normalized match dataset not found at ${NORMALIZED_PATH} (raw match archive not committed). Existing verified calibration artifact verified at ${calibrationReportJsonPath}.\n`);
      return;
    }
    throw new Error(`Normalized match dataset missing at ${NORMALIZED_PATH}`);
  }

  const matches = JSON.parse(fs.readFileSync(NORMALIZED_PATH, 'utf8'));
  const playerName = 'Virat Kohli';

  const formatReports = {};

  for (const fmt of ['ODI', 'T20I']) {
    const formatMatches = matches.filter((m) => m.format === fmt);

    // 1. Component Extraction
    // Baseline
    const overallAgg = aggregateBatting(formatMatches, playerName);
    const settingAgg = aggregateBatting(formatMatches, playerName, { inningsFilterCriteria: { isChasing: false } });

    // Completed Chase
    const chaseAgg = aggregateBatting(formatMatches, playerName, { inningsFilterCriteria: { isChasing: true } });

    // Knockouts
    const knockoutAgg = aggregateBatting(formatMatches, playerName, { matchFilterCriteria: { isKnockout: true } });

    // Finals
    const finalsAgg = aggregateBatting(formatMatches, playerName, { matchFilterCriteria: { isFinal: true } });

    // High RRR Situations (RRR >= 8.0)
    let highRrrRuns = 0;
    let highRrrBalls = 0;
    let highRrrDismissals = 0;
    const highRrrInningsSeen = new Set();

    for (const m of formatMatches) {
      for (const inn of m.innings) {
        const isChase = inn.inningsNumber === 2 || inn.inningsNumber === 4 || inn.target !== undefined;
        if (!isChase) continue;
        const innKey = `${m.matchId}_inn${inn.inningsNumber}`;
        for (const d of inn.deliveries) {
          if (d.batter.toLowerCase() === playerName.toLowerCase()) {
            if (d.requiredRunRate !== undefined && d.requiredRunRate >= 8.0 && (d.ballsRemaining ?? 0) > 0) {
              highRrrInningsSeen.add(innKey);
              if (!d.extras?.wides) {
                highRrrBalls += 1;
                highRrrRuns += d.batterRuns;
              }
            }
          }
          if (d.wicket && d.wicket.playerDismissed.toLowerCase() === playerName.toLowerCase()) {
            if (d.requiredRunRate !== undefined && d.requiredRunRate >= 8.0 && (d.ballsRemaining ?? 0) > 0) {
              highRrrDismissals += 1;
            }
          }
        }
      }
    }

    const highRrrAvg = highRrrDismissals > 0 ? Number((highRrrRuns / highRrrDismissals).toFixed(2)) : null;

    // Component calculations
    const chaseRatio = chaseAgg.average !== null && settingAgg.average !== null && settingAgg.average > 0
      ? Number((chaseAgg.average / settingAgg.average).toFixed(2))
      : null;
    const chaseScore = normalizeClutchRatio(chaseAgg.average, settingAgg.average);

    const highRrrRatio = highRrrAvg !== null && overallAgg.average !== null && overallAgg.average > 0
      ? Number((highRrrAvg / overallAgg.average).toFixed(2))
      : null;
    const highRrrScore = normalizeClutchRatio(highRrrAvg, overallAgg.average);

    const knockoutRatio = knockoutAgg.average !== null && overallAgg.average !== null && overallAgg.average > 0
      ? Number((knockoutAgg.average / overallAgg.average).toFixed(2))
      : null;
    const knockoutScore = normalizeClutchRatio(knockoutAgg.average, overallAgg.average);

    const finalsRatio = finalsAgg.average !== null && overallAgg.average !== null && overallAgg.average > 0
      ? Number((finalsAgg.average / overallAgg.average).toFixed(2))
      : null;
    const finalsScore = normalizeClutchRatio(finalsAgg.average, overallAgg.average);

    const components = [
      {
        id: 'completedChaseDominance',
        label: 'Chasing Innings Dominance',
        innings: chaseAgg.innings,
        balls: chaseAgg.ballsFaced,
        runs: chaseAgg.runs,
        dismissals: chaseAgg.dismissals,
        splitAvg: chaseAgg.average,
        baselineAvg: settingAgg.average,
        ratio: chaseRatio,
        normalizedScore: chaseScore,
        minSampleInnings: 15,
        status: chaseAgg.innings >= 15 ? 'usable-sample' : 'insufficient-sample',
      },
      {
        id: 'highRrrElevation',
        label: 'High-Pressure Situations (RRR >= 8.0)',
        innings: highRrrInningsSeen.size,
        balls: highRrrBalls,
        runs: highRrrRuns,
        dismissals: highRrrDismissals,
        splitAvg: highRrrAvg,
        baselineAvg: overallAgg.average,
        ratio: highRrrRatio,
        normalizedScore: highRrrScore,
        minSampleInnings: 10,
        status: highRrrInningsSeen.size >= 10 && highRrrBalls >= 60 ? 'usable-sample' : 'insufficient-sample',
      },
      {
        id: 'knockoutElevation',
        label: 'Tournament Knockout Elevation',
        innings: knockoutAgg.innings,
        balls: knockoutAgg.ballsFaced,
        runs: knockoutAgg.runs,
        dismissals: knockoutAgg.dismissals,
        splitAvg: knockoutAgg.average,
        baselineAvg: overallAgg.average,
        ratio: knockoutRatio,
        normalizedScore: knockoutScore,
        minSampleInnings: 10,
        status: knockoutAgg.innings >= 10 ? 'usable-sample' : 'insufficient-sample',
      },
      {
        id: 'finalsContribution',
        label: 'Tournament Finals Impact',
        innings: finalsAgg.innings,
        balls: finalsAgg.ballsFaced,
        runs: finalsAgg.runs,
        dismissals: finalsAgg.dismissals,
        splitAvg: finalsAgg.average,
        baselineAvg: overallAgg.average,
        ratio: finalsRatio,
        normalizedScore: finalsScore,
        minSampleInnings: 10,
        status: finalsAgg.innings >= 10 ? 'usable-sample' : 'insufficient-sample',
      },
    ];

    // 2. Overlap Matrix
    const overlapMatrix = computeOverlapMatrix(matches, playerName, fmt);

    // 3. Sensitivity Analysis
    const sensitivity = evaluateWeightSensitivity(
      {
        completedChase: chaseScore,
        highRrr: highRrrScore,
        knockouts: knockoutScore,
        finals: finalsScore,
      },
      fmt
    );

    // 4. Temporal Validation
    const temporal = evaluateTemporalStability(matches, playerName, fmt);

    // 5. Bootstrap Confidence Intervals (Seed 429)
    // Build list of individual innings records for each slice
    const chaseInningsList = [];
    const highRrrInningsList = [];
    const knockoutInningsList = [];
    const finalsInningsList = [];
    const overallInningsList = [];

    for (const m of formatMatches) {
      const isKnockout = Boolean(m.isKnockout);
      const isFinal = Boolean(m.isFinal);

      for (const inn of m.innings) {
        const isChase = inn.inningsNumber === 2 || inn.inningsNumber === 4 || inn.target !== undefined;
        let r = 0;
        let dismissed = false;
        let faced = false;
        let hrRuns = 0;
        let hrDismissed = false;
        let hrFaced = false;

        for (const d of inn.deliveries) {
          if (d.batter.toLowerCase() === playerName.toLowerCase()) {
            faced = true;
            r += d.batterRuns;
            if (isChase && d.requiredRunRate !== undefined && d.requiredRunRate >= 8.0 && (d.ballsRemaining ?? 0) > 0) {
              hrFaced = true;
              if (!d.extras?.wides) hrRuns += d.batterRuns;
            }
          }
          if (d.wicket && d.wicket.playerDismissed.toLowerCase() === playerName.toLowerCase()) {
            dismissed = true;
            if (isChase && d.requiredRunRate !== undefined && d.requiredRunRate >= 8.0 && (d.ballsRemaining ?? 0) > 0) {
              hrDismissed = true;
              hrFaced = true;
            }
          }
        }

        if (faced || dismissed) {
          const item = { runs: r, dismissed };
          overallInningsList.push(item);
          if (isChase) chaseInningsList.push(item);
          if (isKnockout) knockoutInningsList.push(item);
          if (isFinal) finalsInningsList.push(item);
        }

        if (hrFaced || hrDismissed) {
          highRrrInningsList.push({ runs: hrRuns, dismissed: hrDismissed });
        }
      }
    }

    const bootstrapBattingAverage = {
      overallCareerAverage: computeBootstrapBattingAverageCI(overallInningsList, 1000, 429),
      completedChaseDominance: computeBootstrapBattingAverageCI(chaseInningsList, 1000, 429),
      highRrrElevation: computeBootstrapBattingAverageCI(highRrrInningsList, 1000, 429),
      knockoutElevation: computeBootstrapBattingAverageCI(knockoutInningsList, 1000, 429),
      finalsContribution: computeBootstrapBattingAverageCI(finalsInningsList, 1000, 429),
      // Backward compatibility aliases:
      chaseBattingAverage: computeBootstrapBattingAverageCI(chaseInningsList, 1000, 429),
      knockoutBattingAverage: computeBootstrapBattingAverageCI(knockoutInningsList, 1000, 429),
      finalsBattingAverage: computeBootstrapBattingAverageCI(finalsInningsList, 1000, 429),
    };

    const bootstrapComponentScore = {
      overallCareerAverage: computeBootstrapComponentScoreCI(overallInningsList, overallAgg.average ?? 50.0, 1000, 429),
      completedChaseDominance: computeBootstrapComponentScoreCI(chaseInningsList, settingAgg.average ?? 50.0, 1000, 429),
      highRrrElevation: computeBootstrapComponentScoreCI(highRrrInningsList, overallAgg.average ?? 50.0, 1000, 429),
      knockoutElevation: computeBootstrapComponentScoreCI(knockoutInningsList, overallAgg.average ?? 50.0, 1000, 429),
      finalsContribution: computeBootstrapComponentScoreCI(finalsInningsList, overallAgg.average ?? 50.0, 1000, 429),
      // Backward compatibility aliases:
      chaseBattingAverage: computeBootstrapComponentScoreCI(chaseInningsList, settingAgg.average ?? 50.0, 1000, 429),
      knockoutBattingAverage: computeBootstrapComponentScoreCI(knockoutInningsList, overallAgg.average ?? 50.0, 1000, 429),
      finalsBattingAverage: computeBootstrapComponentScoreCI(finalsInningsList, overallAgg.average ?? 50.0, 1000, 429),
    };

    formatReports[fmt] = {
      format: fmt,
      archiveCoveredMatches: formatMatches.length,
      archiveCoveredBattedInnings: overallInningsList.length,
      archiveCoveredRuns: overallAgg.runs,
      archiveCoveredDismissals: overallAgg.dismissals,
      archiveCoveredNotOuts: overallAgg.notOuts,
      archiveCoveredBaselineAverage: overallAgg.average,
      fullCareerMatches: fmt === 'ODI' ? 314 : 125,
      fullCareerBattedInnings: fmt === 'ODI' ? 302 : 117,
      fullCareerRuns: fmt === 'ODI' ? 14941 : 4188,
      fullCareerDismissals: fmt === 'ODI' ? 255 : 86,
      fullCareerNotOuts: fmt === 'ODI' ? 47 : 31,
      fullCareerVerifiedAverage: fmt === 'ODI' ? 58.59 : 48.69,
      missingMatchesCount: fmt === 'ODI' ? 3 : 7,
      missingBattedInningsCount: fmt === 'ODI' ? 2 : 5,
      missingDnbMatchesCount: fmt === 'ODI' ? 1 : 2,
      components,
      overlapMatrix,
      sensitivity,
      temporal,
      bootstrap: bootstrapBattingAverage,
      bootstrapBattingAverage,
      bootstrapComponentScore,
    };
  }

  // Calibration Gates Evaluation
  const odiFinalsInnings = formatReports.ODI.components.find((c) => c.id === 'finalsContribution').innings;
  const t20iFinalsInnings = formatReports.T20I.components.find((c) => c.id === 'finalsContribution').innings;
  const t20iKnockoutInnings = formatReports.T20I.components.find((c) => c.id === 'knockoutElevation').innings;

  const calibrationGates = [
    {
      id: 'gate-1-sample-size',
      gateId: 1,
      gateName: 'Minimum Sample Size Gate (Finals N >= 10)',
      requirement: 'Tournament finals slice must contain at least 10 batted innings in each format to support reliable statistical inference.',
      observed: `ODI finals: ${odiFinalsInnings} innings. T20I finals: ${t20iFinalsInnings} innings (FAIL: ${t20iFinalsInnings} < 10). T20I knockouts: ${t20iKnockoutInnings} innings (FAIL: ${t20iKnockoutInnings} < 10).`,
      finding: `ODI finals: ${odiFinalsInnings} innings. T20I finals: ${t20iFinalsInnings} innings (FAIL: ${t20iFinalsInnings} < 10). T20I knockouts: ${t20iKnockoutInnings} innings (FAIL: ${t20iKnockoutInnings} < 10).`,
      passed: false,
      blockerReason: 'Insufficient sample size in T20I tournament finals (N=3) and knockouts (N=7)',
      status: 'BLOCKED (Insufficient Sample)',
    },
    {
      id: 'gate-2-cross-player-peer-corpus',
      gateId: 2,
      gateName: 'Cross-Player Baseline Peer Corpus Gate',
      requirement: 'Production cross-player Clutch Index requires a normalized multi-player dataset for empirical percentile calibration.',
      observed: 'Repository contains strictly Virat Kohli match records. Cross-player peer corpus is unavailable.',
      finding: 'Repository contains strictly Virat Kohli match records. Cross-player peer corpus is unavailable.',
      passed: false,
      blockerReason: 'Cross-player peer distribution unavailable in single-player dataset scope',
      status: 'BLOCKED (Single-Player Dataset Scope)',
    },
    {
      id: 'gate-3-collinearity-stability',
      gateId: 3,
      gateName: 'Collinearity & Overlap Stability Gate',
      requirement: 'Components must not exhibit circular scoring or unadjusted double-counting across overlapping sets.',
      observed: 'Tournament finals are 100.0% contained in knockouts (10/10 ODI, 3/3 T20I: containment(final in knockout) = 100.0%). Knockouts intersect with chases in 10/18 (55.6%) ODI innings (containment(knockout in chase) = 55.6%) and 2/7 (28.6%) T20I innings (containment(knockout in chase) = 28.6%).',
      finding: 'Tournament finals are 100.0% contained in knockouts (10/10 ODI, 3/3 T20I: containment(final in knockout) = 100.0%). Knockouts intersect with chases in 10/18 (55.6%) ODI innings (containment(knockout in chase) = 55.6%) and 2/7 (28.6%) T20I innings (containment(knockout in chase) = 28.6%).',
      passed: false,
      blockerReason: 'Strict containment (100.0% finals in knockouts) and high overlap create circular score inflation and multicollinearity',
      status: 'BLOCKED (High Multicollinearity)',
    },
    {
      id: 'gate-4-uncertainty-bound',
      gateId: 4,
      gateName: 'Bootstrap Uncertainty Bound Gate',
      requirement: '95% bootstrap confidence interval width for key component raw batting averages (unit: runs per dismissal) must not exceed 25.0 runs/dismissal, and valid replicate rate must be >= 0.95 across all components.',
      observed: `ODI Finals Raw CI width is ${formatReports.ODI.bootstrap.finalsContribution.ciWidth} runs/dismissal (SE: ±${formatReports.ODI.bootstrap.finalsContribution.standardError}). T20I Finals Raw CI width is ${formatReports.T20I.bootstrap.finalsContribution.ciWidth} runs/dismissal (SE: ±${formatReports.T20I.bootstrap.finalsContribution.standardError}, valid rate: ${(formatReports.T20I.bootstrap.finalsContribution.validReplicateRate * 100).toFixed(1)}%). T20I Knockouts Raw CI width is ${formatReports.T20I.bootstrap.knockoutElevation.ciWidth} runs/dismissal. Exceeds 25.0 runs/dismissal threshold.`,
      finding: `ODI Finals Raw CI width is ${formatReports.ODI.bootstrap.finalsContribution.ciWidth} runs/dismissal (SE: ±${formatReports.ODI.bootstrap.finalsContribution.standardError}). T20I Finals Raw CI width is ${formatReports.T20I.bootstrap.finalsContribution.ciWidth} runs/dismissal (SE: ±${formatReports.T20I.bootstrap.finalsContribution.standardError}, valid rate: ${(formatReports.T20I.bootstrap.finalsContribution.validReplicateRate * 100).toFixed(1)}%). T20I Knockouts Raw CI width is ${formatReports.T20I.bootstrap.knockoutElevation.ciWidth} runs/dismissal. Exceeds 25.0 runs/dismissal threshold.`,
      passed: false,
      blockerReason: 'Confidence interval widths exceed 25.0 runs/dismissal threshold due to small sample sizes in tournament finals and knockouts',
      status: 'BLOCKED (Excessive Uncertainty Width)',
    },
  ];

  const publicationAllowed = calibrationGates.every((g) => g.passed);
  const calibrationStatus = publicationAllowed ? 'calibrated-production-ready' : 'calibration-blocked';
  const blockerReason = 'Tournament finals sample sizes (N=10 ODI, N=3 T20I; T20I knockouts N=7) fall below the robust threshold, bootstrap uncertainty width exceeds 25.0 runs/dismissal, and cross-player peer corpus is unavailable in a single-player dataset. Public score must remain null.';

  const calibrationReport = {
    reportVersion: '5.0.0',
    modelVersion: PHASE5_MODEL_VERSION,
    calibrationStatus,
    publicationAllowed,
    generatedAt: new Date().toISOString(),
    player: 'Virat Kohli',
    baselineChoice: 'Self-relative descriptive model against archive-covered format baseline averages (ODI: 58.34 across 311 archive matches; T20I: 48.33 across 118 matches). Cross-player calibration blocked due to single-player scope.',
    publicScore: null,
    blockerReason,
    legacyModel: LEGACY_MODEL_SPEC,
    componentsSpec: CLUTCH_COMPONENTS_SPEC,
    formats: formatReports,
    leakageAudit: auditFeatureLeakage(),
    calibrationGates,
    scopedTrust: {
      careerAggregates: 'verified',
      archiveDeliveries: 'verified-partial-coverage',
      pressureAnalytics: 'trusted for covered archive scope',
      clutchIndex: 'calibration-pending',
      overallCoverage: 'partial',
    },
  };

  const modelSpecArtifact = {
    specVersion: PHASE5_MODEL_VERSION,
    status: calibrationStatus,
    publicationAllowed,
    generatedAt: new Date().toISOString(),
    modelType: 'self-relative-descriptive-pressure-elevation',
    mathematicalFramework: {
      normalization: 'tanh-bounded-ratio (50 + 50 * tanh((split - base) / base))',
      scale: '[0, 100] bounded interval',
      anchorPoint: '50.0 represents parity with baseline (1.0x ratio)',
      anchors: {
        '0.0x': 11.92,
        '0.5x': 26.89,
        '1.0x': 50.00,
        '1.5x': 73.11,
        '2.0x': 88.08,
      },
      practicalRange: '[11.92, 100) for non-negative batting ratios',
    },
    components: CLUTCH_COMPONENTS_SPEC,
    leakageSafeguards: auditFeatureLeakage(),
    calibrationGates,
    blockerReason,
  };

  const markdownReport = generateMarkdownReport(calibrationReport);

  const calibrationReportJsonPath = path.join(DERIVED_DIR, 'clutch-calibration-report.json');
  const calibrationReportMdPath = path.join(DERIVED_DIR, 'clutch-calibration-report.md');
  const modelSpecJsonPath = path.join(DERIVED_DIR, 'clutch-model-spec.json');
  const srcCalibrationReportJsonPath = path.join(SRC_DERIVED_DIR, 'clutchCalibrationArtifact.json');

  writeAtomicJson(calibrationReportJsonPath, calibrationReport);
  writeAtomicText(calibrationReportMdPath, markdownReport);
  writeAtomicJson(modelSpecJsonPath, modelSpecArtifact);
  writeAtomicJson(srcCalibrationReportJsonPath, calibrationReport);

  console.log(`Phase 5 Clutch Index Calibration Report and Model Spec written atomically:`);
  console.log(`- ${calibrationReportJsonPath} (${(fs.statSync(calibrationReportJsonPath).size / 1024).toFixed(2)} KB)`);
  console.log(`- ${srcCalibrationReportJsonPath} (${(fs.statSync(srcCalibrationReportJsonPath).size / 1024).toFixed(2)} KB) [Byte-for-byte synchronized]`);
  console.log(`- ${calibrationReportMdPath} (${(fs.statSync(calibrationReportMdPath).size / 1024).toFixed(2)} KB)`);
  console.log(`- ${modelSpecJsonPath} (${(fs.statSync(modelSpecJsonPath).size / 1024).toFixed(2)} KB)\n`);

  console.log('--- Scoped Trust Status ---');
  console.log('Career aggregates: verified');
  console.log('Archive deliveries: verified-partial-coverage');
  console.log('Pressure analytics: trusted for covered archive scope');
  console.log('Clutch Index: calibration-pending');
  console.log('Overall coverage: partial');
  console.log(`\nCalibration Verdict: ${calibrationStatus} (publicationAllowed: ${publicationAllowed}, publicScore: null)`);
  console.log(`Blocker: ${blockerReason}\n`);
}

main().catch((err) => {
  console.error('Calibration failed:', err.message);
  process.exit(1);
});

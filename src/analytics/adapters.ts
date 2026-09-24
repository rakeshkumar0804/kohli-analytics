import type {
  ClutchIndexOutput,
  PressureCellOutput,
  ChaseMetricsOutput,
} from './types.ts';
import type { PressureCell, Format } from '../types/index.ts';
import { calculateClutchIndexFromMatches } from './clutchMetrics.ts';
import { derivePressureMap } from './pressureMetrics.ts';
import { clutchMetricsByFormat, pressureMapDataByFormat } from '../data/kohliData.ts';
import rawArtifact from '../data/derived/kohliAnalyticsArtifact.json' with { type: 'json' };
import clutchArtifact from '../data/derived/clutchCalibrationArtifact.json' with { type: 'json' };
import { TEST_SITUATIONAL_SPLITS, TEST_CAREER_BASELINE } from '../data/testSituationalData.ts';

export interface BreakdownItemViewModel {
  label: string;
  weight: number;
  value: number;
  baseline: number;
  unit: string;
  color: string;
  description: string;
}

export interface ClutchComponentViewModel {
  id: string;
  label: string;
  innings: number;
  balls: number;
  runs: number;
  dismissals: number;
  splitAvg: number | null;
  baselineAvg: number | null;
  ratio: number | null;
  normalizedScore: number | null;
  minSampleInnings: number;
  status: string;
}

export interface CalibrationGateViewModel {
  gateId: number;
  gateName: string;
  requirement: string;
  finding: string;
  passed: boolean;
  status: string;
}

export interface SituationalViewCard {
  id: string;
  title: string;
  category: string;
  innings: number;
  balls: number;
  runs: number;
  dismissals: number;
  notOuts: number;
  battingAvg: number | null;
  battingAvgDisplay: string;
  strikeRate: number | null;
  strikeRateDisplay: string;
  baselineAvg: number | null;
  baselineAvgDisplay: string;
  baselineScopeLabel: string;
  elevationPercent: number | null;
  elevationDisplay: string;
  isElevationPositive: boolean;
  minSampleInnings: number;
  sampleStatus: 'usable-sample' | 'insufficient-sample';
  sampleBadgeText: string;
  coverageLabel: string;
  scopeDescription: string;
}

export interface OverlapRelation {
  label: string;
  containment: string;
  finding: string;
  directionalMath: string;
}

export interface PressurePerformanceFormatView {
  format: 'ODI' | 'T20I' | 'Test';
  isApplicable: boolean;
  cards: SituationalViewCard[];
  overlapRelations: OverlapRelation[];
  overlapWarning: string;
  coverageDisclosure: string;
  careerAggregatesNote: string;
}

export interface ClutchViewModel {
  status: 'calibration-pending' | 'calibration-blocked' | 'computed' | 'insufficient-data';
  scoreDisplay: string;
  badgeLabel: string;
  subtext: string;
  warningNote: string;
  formatNote: string;
  dynamicBreakdown: BreakdownItemViewModel[];
  clutchCalc: {
    status: 'calibration-pending';
    label: string;
    sublabel: string;
    message: string;
  };
  modelVersion: string;
  calibrationStatus: string;
  blockerReason: string;
  components: ClutchComponentViewModel[];
  overlapWarning?: string;
  calibrationGates: CalibrationGateViewModel[];
  pressurePerformance: PressurePerformanceFormatView;
}

export interface PressureMapViewModel {
  format: 'ODI' | 'Test' | 'T20I';
  cells: PressureCell[];
  isDerived: boolean;
  warningLabel: string;
  minAvg: number;
  maxAvg: number;
}

/**
 * Builds structured situational cards for Pressure Performance dashboard.
 */
function buildSituationalCards(format: 'ODI' | 'T20I'): SituationalViewCard[] {
  const fmtData = clutchArtifact?.formats?.[format];
  const comps = fmtData?.components || [];

  const compMap: Record<string, typeof comps[0]> = {};
  for (const c of comps) {
    compMap[c.id] = c;
  }

  const titles: Record<string, { title: string; category: string; desc: string; cov: string }> = {
    completedChaseDominance: {
      title: 'Chasing Innings',
      category: '2nd Innings Target Pursuit',
      desc: 'All 2nd innings run chasing appearances where a target was pursued regardless of final match outcome.',
      cov: format === 'ODI' ? '165 chasing innings (311 archive matches)' : '47 chasing innings (118 archive matches)',
    },
    highRrrElevation: {
      title: 'High-RRR Situations',
      category: 'High Required Run Rate (RRR ≥ 8.0)',
      desc: 'Deliveries faced in 2nd innings run chases when required run rate was 8.0+ rpo.',
      cov: format === 'ODI' ? '24 high-pressure chase innings' : '28 high-pressure chase innings',
    },
    knockoutElevation: {
      title: 'Tournament Knockouts',
      category: format === 'ODI' ? 'ICC Elimination Matches' : 'Tournament Elimination Matches',
      desc: format === 'ODI' ? 'Quarter-finals, semi-finals, and finals in ICC ODI tournaments (CWC & CT).' : "Semi-finals and finals across ICC Men's T20 World Cups and Asia Cup T20 (including 2016 Final #966765).",
      cov: format === 'ODI' ? '18 ICC knockout innings' : '7 tournament knockout innings (6 ICC T20 World Cup + 1 Asia Cup Final)',
    },
    finalsContribution: {
      title: 'Tournament Finals',
      category: 'Championship Deciders',
      desc: format === 'ODI' ? 'Championship finals across ICC and Asia Cup tournaments.' : "Championship finals across ICC Men's T20 World Cups and Asia Cup T20 (3 matches: 2014 Final, 2016 Asia Cup Final, 2024 Final).",
      cov: format === 'ODI' ? '10 tournament finals innings (100% inside Knockouts)' : '3 tournament finals innings (100% inside Knockouts)',
    },
  };

  const cardOrder = ['completedChaseDominance', 'highRrrElevation', 'knockoutElevation', 'finalsContribution'];

  return cardOrder.map((id) => {
    const c = compMap[id] || {
      id,
      innings: 0,
      balls: 0,
      runs: 0,
      dismissals: 0,
      splitAvg: null,
      baselineAvg: null,
      minSampleInnings: 10,
      status: 'insufficient-sample',
    };

    const notOuts = Math.max(0, c.innings - c.dismissals);
    const battingAvg = c.dismissals > 0 ? Number((c.runs / c.dismissals).toFixed(2)) : (c.runs > 0 ? null : null);
    const battingAvgDisplay = c.dismissals > 0 ? (c.runs / c.dismissals).toFixed(2) : 'N/A (Unbeaten)';
    const strikeRate = c.balls > 0 ? Number(((c.runs / c.balls) * 100).toFixed(2)) : null;
    const strikeRateDisplay = strikeRate !== null ? strikeRate.toFixed(2) : '—';
    const baselineAvg = c.baselineAvg ?? (format === 'ODI' ? 58.34 : 48.33);
    const baselineScopeLabel = id === 'completedChaseDominance'
      ? 'Covered-archive 1st-innings batting average'
      : 'Covered-archive batting average';
    const baselineAvgDisplay = baselineAvg !== null
      ? `${baselineAvg.toFixed(2)} (${id === 'completedChaseDominance' ? 'Covered 1st Inn' : 'Covered Archive'})`
      : '—';
    
    let elevationPercent: number | null = null;
    if (c.splitAvg !== null && baselineAvg !== null && baselineAvg > 0) {
      elevationPercent = Number((((c.splitAvg - baselineAvg) / baselineAvg) * 100).toFixed(1));
    }
    const elevationDisplay = elevationPercent !== null
      ? (elevationPercent >= 0 ? `+${elevationPercent.toFixed(1)}%` : `${elevationPercent.toFixed(1)}%`)
      : '—';
    const isElevationPositive = elevationPercent !== null && elevationPercent >= 0;

    const sampleStatus = (c.innings >= c.minSampleInnings ? 'usable-sample' : 'insufficient-sample') as 'usable-sample' | 'insufficient-sample';
    const sampleBadgeText = c.innings >= 15
      ? `Standard Sample (N=${c.innings} ≥ 15)`
      : c.innings >= 10
      ? `Moderate Sample (N=${c.innings} ≥ 10)`
      : `Small Sample (N=${c.innings} < 10) ⚠️`;

    const meta = titles[id] || {
      title: c.label,
      category: 'Pressure Metric',
      desc: 'Situational metric from ball-by-ball archive.',
      cov: `${c.innings} innings`,
    };

    return {
      id,
      title: meta.title,
      category: meta.category,
      innings: c.innings,
      balls: c.balls,
      runs: c.runs,
      dismissals: c.dismissals,
      notOuts,
      battingAvg,
      battingAvgDisplay,
      strikeRate,
      strikeRateDisplay,
      baselineAvg,
      baselineAvgDisplay,
      baselineScopeLabel,
      elevationPercent,
      elevationDisplay,
      isElevationPositive,
      minSampleInnings: c.minSampleInnings,
      sampleStatus,
      sampleBadgeText,
      coverageLabel: meta.cov,
      scopeDescription: meta.desc,
    };
  });
}

/**
 * Builds plain language overlap relations for the format.
 */
function buildOverlapRelations(format: 'ODI' | 'T20I'): OverlapRelation[] {
  if (format === 'ODI') {
    return [
      {
        label: 'Finals ⊆ Knockouts (100% Containment)',
        containment: '10 / 10 innings (100.0%)',
        finding: 'Every tournament final is already fully counted inside the tournament knockouts population (10 finals + 8 semi-finals/quarter-finals = 18 knockouts). Combining them with additive weights causes circular double-counting.',
        directionalMath: 'count(finals in knockouts) / count(finals) = 10/10 (100.0%)',
      },
      {
        label: 'High-RRR ⊆ Chasing Innings (100% Containment)',
        containment: '24 / 24 innings (100.0%)',
        finding: 'High required run rate situations (RRR ≥ 8.0) exist strictly within 2nd innings chasing innings. They represent high-stress phase subsets, not separate match fixtures.',
        directionalMath: 'count(high-RRR in chases) / count(high-RRR) = 24/24 (100.0%)',
      },
      {
        label: 'Knockouts ∩ Chasing Innings (38.9% Intersection)',
        containment: '7 / 18 innings (38.9%)',
        finding: '7 of 18 ODI knockout innings occurred while chasing (e.g. 2011 CWC Final 35). The remaining 11 occurred while batting first (e.g. 2023 CWC Semi-Final 117).',
        directionalMath: 'count(knockouts in chases) / count(knockouts) = 7/18 (38.9%)',
      },
    ];
  }

  return [
    {
      label: 'Finals ⊆ Knockouts (100% Containment)',
      containment: '3 / 3 innings (100.0%)',
      finding: 'All 3 T20I finals (2014 Final vs SL #682965, 2016 Asia Cup Final vs BAN #966765, 2024 Final vs SA #1415755) are strictly contained within the 7 knockout matches. Semi-finals (#682963, #951371, #1298178, #1415754) are knockouts, not finals. With N=3, isolated sub-group weighting has severe sample sparsity.',
      directionalMath: 'count(finals in knockouts) / count(finals) = 3/3 (100.0%)',
    },
    {
      label: 'High-RRR ⊆ Chasing Innings (100% Containment)',
      containment: '28 / 28 innings (100.0%)',
      finding: 'All 28 high-RRR situations occurred during 2nd innings chasing innings. They capture acceleration pressure within existing chase innings.',
      directionalMath: 'count(high-RRR in chases) / count(high-RRR) = 28/28 (100.0%)',
    },
    {
      label: 'Knockouts ∩ Chasing Innings (28.6% Intersection)',
      containment: '2 / 7 innings (28.6%)',
      finding: '2 of 7 T20I knockout innings were in chases (2014 SF 72* #682963, 2016 SF 89* #951371). The 2016 Asia Cup Final (41*), 2014 Final (77), 2022 SF (50), 2024 SF (9), and 2024 Final (76) were target-setting games.',
      directionalMath: 'count(knockouts in chases) / count(knockouts) = 2/7 (28.6%)',
    },
  ];
}

/**
 * Builds structured situational cards for Test cricket from verified scorecard dataset.
 */
function buildTestSituationalCards(): SituationalViewCard[] {
  const baseAvg = TEST_CAREER_BASELINE.battingAvg; // 46.85

  return TEST_SITUATIONAL_SPLITS.map((split) => {
    const notOuts = split.notOuts;
    const battingAvg = split.dismissals > 0 ? Number((split.runs / split.dismissals).toFixed(2)) : null;
    const battingAvgDisplay = split.dismissals > 0 ? (split.runs / split.dismissals).toFixed(2) : 'N/A (Unbeaten)';
    const strikeRate = split.balls > 0 ? Number(((split.runs / split.balls) * 100).toFixed(2)) : null;
    const strikeRateDisplay = strikeRate !== null ? strikeRate.toFixed(2) : '—';
    const baselineAvg = baseAvg;
    const baselineScopeLabel = 'Career Test Batting Average (46.85 across 123 matches)';
    const baselineAvgDisplay = `${baseAvg.toFixed(2)} (Career Base)`;

    let elevationPercent: number | null = null;
    if (battingAvg !== null && baseAvg > 0) {
      elevationPercent = Number((((battingAvg - baseAvg) / baseAvg) * 100).toFixed(1));
    }
    const elevationDisplay = elevationPercent !== null
      ? (elevationPercent >= 0 ? `+${elevationPercent.toFixed(1)}%` : `${elevationPercent.toFixed(1)}%`)
      : '—';
    const isElevationPositive = elevationPercent !== null && elevationPercent >= 0;

    const sampleStatus = (split.innings >= 10 ? 'usable-sample' : 'insufficient-sample') as 'usable-sample' | 'insufficient-sample';
    const sampleBadgeText = split.innings >= 15
      ? `Standard Sample (N=${split.innings} ≥ 15)`
      : split.innings >= 10
      ? `Moderate Sample (N=${split.innings} ≥ 10)`
      : `Small Sample (N=${split.innings} < 10) ⚠️`;

    return {
      id: split.id,
      title: split.title,
      category: split.category,
      innings: split.innings,
      balls: split.balls,
      runs: split.runs,
      dismissals: split.dismissals,
      notOuts,
      battingAvg,
      battingAvgDisplay,
      strikeRate,
      strikeRateDisplay,
      baselineAvg,
      baselineAvgDisplay,
      baselineScopeLabel,
      elevationPercent,
      elevationDisplay,
      isElevationPositive,
      minSampleInnings: 10,
      sampleStatus,
      sampleBadgeText,
      coverageLabel: split.coverageLabel,
      scopeDescription: split.scopeDescription,
    };
  });
}

/**
 * Builds format-specific Pressure Performance view model.
 */
export function getPressurePerformanceView(format: 'ODI' | 'T20I' | 'Test'): PressurePerformanceFormatView {
  if (format === 'Test') {
    const cards = buildTestSituationalCards();
    return {
      format: 'Test',
      isApplicable: true,
      cards,
      overlapRelations: [
        {
          label: '4th Match Innings ⊆ 2nd Team Innings (100% Containment)',
          containment: '32 / 32 innings (100.0%)',
          finding: 'All 32 fourth-innings appearances belong to India\'s second batting turn (Match innings 3 or 4). In 6 other matches with a 4th innings, India won without Kohli batting (DNB).',
          directionalMath: 'count(4th inn in 2nd team inn) / count(4th inn) = 32/32 (100.0%)',
        },
        {
          label: 'Team Wins ∩ 1st Team Innings (60.8% Containment)',
          containment: '62 / 102 innings (60.8%)',
          finding: '62 of 102 innings in Test victories occurred during India\'s 1st team innings, setting match-winning totals.',
          directionalMath: 'count(wins in 1st team inn) / count(wins inn) = 62/102 (60.8%)',
        },
      ],
      overlapWarning: 'Test situational splits reflect match state, pitch decay, and geographical conditions. They are excluded from limited-overs RRR models.',
      coverageDisclosure: 'Calculated from official ESPNcricinfo Statsguru database (Player ID: 253802) across 123 Test matches (210 batting innings, 16,608 balls faced). 100% scorecard coverage with verified balls faced.',
      careerAggregatesNote: 'Virat Kohli Test Career Baseline: 123 matches, 210 innings (13 not outs), 9,230 runs, 46.85 batting average, 30 centuries (7 double hundreds), 55.58 strike rate.',
    };
  }

  const cards = buildSituationalCards(format);
  const overlapRelations = buildOverlapRelations(format);
  const overlapWarning = format === 'ODI'
    ? 'Directional containment analysis reveals Tournament Finals are 100.0% contained within Knockouts (10/10), and High-RRR is 100.0% contained in Chases (24/24). Unadjusted additive combination causes circular scoring inflation.'
    : 'Directional containment analysis reveals Tournament Finals are 100.0% contained within Knockouts (3/3), and Knockouts intersect with Chases (2/7 = 28.6%). Unadjusted additive combination causes circular scoring inflation.';

  const coverageDisclosure = format === 'ODI'
    ? 'Calculated from 311 of 314 official ODI matches (300 batting innings + 11 DNB) with delivery-level data. Career aggregates (14,941 runs, 58.59 avg) are independently verified.'
    : 'Calculated from 118 of 125 official T20I matches (112 batting innings + 6 DNB) with delivery-level data. Career aggregates (4,188 runs, 48.70 avg) are independently verified.';

  const careerAggregatesNote = format === 'ODI'
    ? 'Virat Kohli ODI career: 314 matches, 302 innings, 14,941 runs, 58.59 batting average, 54 centuries.'
    : 'Virat Kohli T20I career: 125 matches, 117 innings, 4,188 runs, 48.70 batting average, 1 century, 38 fifties.';

  return {
    format,
    isApplicable: true,
    cards,
    overlapRelations,
    overlapWarning,
    coverageDisclosure,
    careerAggregatesNote,
  };
}

/**
 * Transforms Clutch Index pipeline output into a presentation-ready View Model for UI components.
 */
export function adaptClutchToViewModel(output: ClutchIndexOutput): ClutchViewModel {
  const isPending = output.status === 'calibration-pending' || output.score === null;
  const pressurePerformance = getPressurePerformanceView('ODI');

  return {
    status: output.status,
    scoreDisplay: output.score !== null ? output.score.toFixed(1) : 'CALIBRATION PENDING',
    badgeLabel: isPending ? 'CALIBRATION PENDING' : 'COMPUTED INDEX',
    subtext: isPending
      ? 'Ball-by-ball model in Phase 5'
      : `Model v${output.modelVersion} (${output.sampleSize.innings} innings analyzed)`,
    warningNote: 'EXPERIMENTAL INPUT — raw chase and knockout averages derived from ball-by-ball dataset',
    formatNote: 'Experimental composite metric under calibration.',
    dynamicBreakdown: [],
    clutchCalc: {
      status: 'calibration-pending',
      label: 'CALIBRATION PENDING',
      sublabel: 'Experimental Metric',
      message: 'Phase 5 Clutch Index calibration blocked: insufficient finals sample size & cross-player baseline absence.',
    },
    modelVersion: clutchArtifact?.modelVersion || '1.0.0-model-spec',
    calibrationStatus: clutchArtifact?.calibrationStatus || 'calibration-blocked',
    blockerReason: clutchArtifact?.blockerReason || 'Tournament finals sample sizes fall below minimum threshold.',
    components: (clutchArtifact?.formats?.ODI?.components as ClutchComponentViewModel[]) || [],
    overlapWarning: clutchArtifact?.formats?.ODI?.overlapMatrix?.collinearityWarning,
    calibrationGates: (clutchArtifact?.calibrationGates as CalibrationGateViewModel[]) || [],
    pressurePerformance,
  };
}

/**
 * View-model provider for ClutchSection component.
 * Executes the analytics pipeline and supplies formatted view model.
 */
export function getClutchViewModel(format: 'ODI' | 'Test' | 'T20I'): ClutchViewModel {
  const currentMetrics = clutchMetricsByFormat[format];
  const hasIngestedData = Boolean(rawArtifact && rawArtifact.coverage && rawArtifact.coverage.totalMatches > 0);

  // Run pipeline in pending state (trust gate preserved)
  const pipelineOutput = calculateClutchIndexFromMatches([], 'Virat Kohli', {
    isProductionDataset: false,
  });

  const dynamicBreakdown: BreakdownItemViewModel[] = [
    {
      label: format === 'Test' ? '4th Innings Chases' : 'Chase Dominance',
      weight: 35,
      value: currentMetrics.chaseAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#C8102E',
      description: format === 'Test' ? '4th innings Test chasing average' : 'Run chase batting average vs baseline',
    },
    {
      label: format === 'Test' ? 'SENA Away Test Elevation' : format === 'T20I' ? 'T20 WC Knockouts' : 'Knockout Elevation',
      weight: 25,
      value: currentMetrics.knockoutAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#e07b39',
      description: format === 'Test' ? 'SENA test match average' : 'ICC knockout match average',
    },
    {
      label: format === 'Test' ? 'WTC Deciders / Finals' : 'Finals Performance',
      weight: 20,
      value: currentMetrics.finalsAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#FFD700',
      description: format === 'Test' ? 'WTC decider batting average' : 'Tournament finals batting average',
    },
    {
      label: format === 'T20I' ? 'Death Overs SR Boost' : 'SR Pressure Boost',
      weight: 20,
      value: currentMetrics.chaseSR,
      baseline: currentMetrics.baselineSR,
      unit: 'SR',
      color: '#22c55e',
      description: format === 'T20I' ? 'Death overs strike rate in chases' : 'Chase strike rate vs baseline',
    },
  ];

  const badgeLabel = hasIngestedData
    ? 'CALIBRATION PENDING — PRODUCTION DATA INGESTED'
    : 'CALIBRATION PENDING';

  const subtext = hasIngestedData
    ? `Ball-by-ball model in Phase 5 (${rawArtifact.coverage.totalMatches} matches ingested; composite weights under calibration)`
    : 'Ball-by-ball model in Phase 5';

  const formatCalibration = format === 'ODI' || format === 'T20I' ? clutchArtifact?.formats?.[format] : null;
  const pressurePerformance = getPressurePerformanceView(format);

  return {
    status: pipelineOutput.status,
    scoreDisplay: 'CALIBRATION PENDING',
    badgeLabel,
    subtext,
    warningNote: 'EXPERIMENTAL INPUT — raw chase and knockout averages pending ball-by-ball source derivation',
    formatNote: currentMetrics.formatNote,
    dynamicBreakdown,
    clutchCalc: {
      status: 'calibration-pending',
      label: 'CALIBRATION PENDING',
      sublabel: 'Experimental Metric',
      message: 'Phase 5 Clutch Index calibration blocked: insufficient finals sample size & cross-player baseline absence.',
    },
    modelVersion: clutchArtifact?.modelVersion || '1.0.0-model-spec',
    calibrationStatus: clutchArtifact?.calibrationStatus || 'calibration-blocked',
    blockerReason: clutchArtifact?.blockerReason || 'Tournament finals sample sizes fall below minimum threshold.',
    components: (formatCalibration?.components as ClutchComponentViewModel[]) || [],
    overlapWarning: formatCalibration?.overlapMatrix?.collinearityWarning,
    calibrationGates: (clutchArtifact?.calibrationGates as CalibrationGateViewModel[]) || [],
    pressurePerformance,
  };
}

/**
 * Transforms derived Pressure Map pipeline output into UI model.
 * Phase 4: passes through all 5 RRR bands natively (no severe/extreme → mountain collapse).
 */
export function adaptPressureMapToViewModel(
  cells: PressureCellOutput[],
  fallbackData: PressureCell[]
): { cells: PressureCell[]; isDerived: boolean; warningLabel: string } {
  const hasData = cells.length > 0;

  if (!hasData) {
    return {
      cells: fallbackData,
      isDerived: false,
      warningLabel: 'EXPERIMENTAL PLACEHOLDER — ball-by-ball situation model derivation pending',
    };
  }


  const mappedCells: PressureCell[] = cells.map((c) => ({
    phase: c.phase,
    pressureLevel: c.pressureLevel,
    rrrRange: c.rrrRange,
    rrrBand: c.rrrBand,
    average: c.average !== undefined ? c.average : null,
    strikeRate: c.battingStrikeRate ?? c.strikeRate ?? 0,
    battingStrikeRate: c.battingStrikeRate ?? c.strikeRate ?? 0,
    scoringRatePer100LegalDeliveries: c.scoringRatePer100LegalDeliveries ?? undefined,
    innings: c.sampleSize.inningsCount,
    ballsFaced: c.officialBatterBallsFaced ?? c.sampleSize.ballsFaced,
    officialBatterBallsFaced: c.officialBatterBallsFaced ?? c.sampleSize.ballsFaced,
    teamLegalDeliveries: c.teamLegalDeliveries ?? c.sampleSize.teamLegalDeliveries,
    strikerDeliveries: c.strikerDeliveries ?? c.sampleSize.strikerDeliveries,
    wideDeliveries: c.wideDeliveries ?? c.sampleSize.wideDeliveries,
    noBallDeliveries: c.noBallDeliveries ?? c.sampleSize.noBallDeliveries,
    runs: c.runs,
    dismissals: c.dismissals,
    fours: c.fours,
    sixes: c.sixes,
    dotBallPercentage: c.dotBallPercentage ?? undefined,
    boundaryPercentage: c.boundaryPercentage ?? undefined,
    sampleSizeBand: c.sampleSizeBand,
  }));

  return {
    cells: mappedCells,
    isDerived: true,
    warningLabel: 'DERIVED FROM BALL-BY-BALL SITUATION MODEL',
  };
}


/**
 * View-model provider for PressureSection component.
 */
export function getPressureMapViewModel(format: Format): PressureMapViewModel {
  const fallbackData = pressureMapDataByFormat[format];

  if (format === 'Test') {
    const fallbackNumericAvgs = fallbackData.map((c) => c.average).filter((a): a is number => a !== null);
    return {
      format: 'Test',
      cells: fallbackData,
      isDerived: false,
      warningLabel: 'EXPERIMENTAL PLACEHOLDER — Test session/innings target model derivation pending (TEST)',
      minAvg: fallbackNumericAvgs.length > 0 ? Math.min(...fallbackNumericAvgs) : 0,
      maxAvg: fallbackNumericAvgs.length > 0 ? Math.max(...fallbackNumericAvgs) : 0,
    };
  }

  // Check if derived artifact has valid calculated cells for this format
  const artifactFormatData = (rawArtifact as Record<string, unknown>)?.pressureMap as Record<string, { cells?: PressureCellOutput[] }> | undefined;
  const artifactCells = artifactFormatData?.[format]?.cells;

  if (artifactCells && artifactCells.length === 15) {
    const adapted = adaptPressureMapToViewModel(artifactCells, fallbackData);
    const numericAvgs = adapted.cells.map((c) => c.average).filter((a): a is number => a !== null);
    const minAvg = numericAvgs.length > 0 ? Math.min(...numericAvgs) : 0;
    const maxAvg = numericAvgs.length > 0 ? Math.max(...numericAvgs) : 0;
    return {
      format,
      cells: adapted.cells,
      isDerived: adapted.isDerived,
      warningLabel: adapted.isDerived
        ? `DERIVED FROM CRICSHEET BALL-BY-BALL SITUATION MODEL (${format.toUpperCase()})`
        : `EXPERIMENTAL PLACEHOLDER — ball-by-ball situation model derivation pending (${format.toUpperCase()})`,
      minAvg,
      maxAvg,
    };
  }

  const derivationResult = derivePressureMap([], 'Virat Kohli', format);
  const adapted = adaptPressureMapToViewModel(derivationResult.cells, fallbackData);

  const numericAvgs = adapted.cells.map((c) => c.average).filter((a): a is number => a !== null);
  const minAvg = numericAvgs.length > 0 ? Math.min(...numericAvgs) : 0;
  const maxAvg = numericAvgs.length > 0 ? Math.max(...numericAvgs) : 0;

  const warningLabel = `EXPERIMENTAL PLACEHOLDER — ball-by-ball situation model derivation pending (${format.toUpperCase()})`;

  return {
    format,
    cells: adapted.cells,
    isDerived: adapted.isDerived,
    warningLabel,
    minAvg,
    maxAvg,
  };
}

/**
 * Transforms Chase metrics into a UI summary object.
 */
export function adaptChaseMetricsToViewModel(output: ChaseMetricsOutput) {
  return {
    status: output.status,
    inningsCount: output.inningsCount,
    runs: output.runs,
    average: output.average !== null ? output.average.toFixed(2) : 'N/A',
    strikeRate: output.strikeRate !== null ? output.strikeRate.toFixed(2) : 'N/A',
    successfulChaseAverage: output.successfulChaseAverage !== null ? output.successfulChaseAverage.toFixed(2) : 'N/A',
    targetBands: output.targetBands,
  };
}

/**
 * View-model provider for ChaseSection component.
 * Reads production chase data from derived artifact and exposes population-specific summaries.
 */
export function getChaseAnalyticsViewModel(format: 'ODI' | 'T20I' | 'overall' = 'ODI') {
  const artifactChase = (rawArtifact as Record<string, unknown>)?.chaseMetrics as Record<string, ChaseMetricsOutput> | undefined;
  const chaseData = artifactChase?.[format];
  const pressureAcc = (rawArtifact as Record<string, unknown>)?.pressureAccounting as Record<string, Record<string, unknown>> | undefined;
  const formatAcc = pressureAcc?.[format];

  if (chaseData && chaseData.inningsCount > 0) {
    const successRate = chaseData.successfulInningsCount > 0 && chaseData.inningsCount > 0
      ? Number(((chaseData.successfulInningsCount / chaseData.inningsCount) * 100).toFixed(1))
      : null;

    // Population A: All Batting Chase Innings
    const battingChaseSummary = {
      population: 'All innings in which Kohli batted (faced balls or was at the crease) while India chased',
      inningsCount: chaseData.inningsCount,
      runs: chaseData.runs,
      dismissals: chaseData.dismissals,
      average: chaseData.average,
      strikeRate: chaseData.strikeRate,
      ballsFaced: chaseData.sampleSize.balls,
    };

    // Population B: Completed Outcome Chase Innings
    const completedOutcomeSummary = {
      population: 'Chase innings reaching a completed match result (won, lost, or tied)',
      completedInnings: chaseData.inningsCount,
      wins: chaseData.successfulInningsCount,
      winRate: successRate,
      winRateDefinition: `${chaseData.successfulInningsCount} wins / ${chaseData.inningsCount} completed chase innings (${successRate}%)`,
    };

    // Population C: Pressure Model Eligible Deliveries
    const pressureEligibleSummary = {
      population: 'Deliveries with finite target, scheduled overs limit, and legal balls remaining',
      eligibleInnings: (formatAcc?.eligibleChaseInningsIncluded as number) ?? chaseData.inningsCount,
      includedDeliveries: (formatAcc?.strikerDeliveriesIncluded as number) ?? 0,
      includedLegalBalls: (formatAcc?.ballsFacedIncluded as number) ?? 0,
    };

    return {
      status: chaseData.status,
      isDerived: true,
      format,
      inningsCount: chaseData.inningsCount,
      successfulInningsCount: chaseData.successfulInningsCount,
      successRate,
      runs: chaseData.runs,
      dismissals: chaseData.dismissals,
      average: chaseData.average,
      strikeRate: chaseData.strikeRate,
      successfulChaseAverage: chaseData.successfulChaseAverage,
      targetBands: chaseData.targetBands,
      sampleSize: chaseData.sampleSize,
      battingChaseSummary,
      completedOutcomeSummary,
      pressureEligibleSummary,
      warnings: chaseData.warnings,
      coverageNote: `Derived from ${rawArtifact?.coverage?.archiveMatches ?? 0} of ${rawArtifact?.coverage?.referenceMatches ?? 0} reference matches`,
    };
  }

  return {
    status: 'unavailable' as const,
    isDerived: false,
    format,
    inningsCount: 0,
    successfulInningsCount: 0,
    successRate: null,
    runs: 0,
    dismissals: 0,
    average: null,
    strikeRate: null,
    successfulChaseAverage: null,
    targetBands: [],
    sampleSize: { matches: 0, innings: 0, balls: 0 },
    battingChaseSummary: null,
    completedOutcomeSummary: null,
    pressureEligibleSummary: null,
    warnings: ['Chase analytics not available — derived artifact missing or empty'],
    coverageNote: 'No production data available',
  };
}


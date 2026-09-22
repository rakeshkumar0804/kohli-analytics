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

export interface BreakdownItemViewModel {
  label: string;
  weight: number;
  value: number;
  baseline: number;
  unit: string;
  color: string;
  description: string;
}

export interface ClutchViewModel {
  status: 'calibration-pending' | 'computed' | 'insufficient-data';
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
 * Transforms Clutch Index pipeline output into a presentation-ready View Model for UI components.
 */
export function adaptClutchToViewModel(output: ClutchIndexOutput): ClutchViewModel {
  const isPending = output.status === 'calibration-pending' || output.score === null;

  return {
    status: output.status,
    scoreDisplay: output.score !== null ? output.score.toFixed(1) : 'CALIBRATION PENDING',
    badgeLabel: isPending ? 'CALIBRATION PENDING' : 'COMPUTED INDEX',
    subtext: isPending
      ? 'Ball-by-ball model in Phase 3'
      : `Model v${output.modelVersion} (${output.sampleSize.innings} innings analyzed)`,
    warningNote: 'EXPERIMENTAL INPUT — raw chase and knockout averages derived from ball-by-ball dataset',
    formatNote: 'Experimental composite metric under calibration.',
    dynamicBreakdown: [],
    clutchCalc: {
      status: 'calibration-pending',
      label: 'CALIBRATION PENDING',
      sublabel: 'Experimental Metric',
      message: 'Phase 3 derives situational performance from open Cricsheet ball-by-ball data.',
    },
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
    ? `Ball-by-ball model in Phase 3 (${rawArtifact.coverage.totalMatches} matches ingested; composite weights under calibration)`
    : 'Ball-by-ball model in Phase 3';

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
      message: 'Phase 3 derives situational performance from open Cricsheet ball-by-ball data.',
    },
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


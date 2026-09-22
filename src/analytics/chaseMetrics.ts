import type {
  NormalizedMatch,
  ChaseMetricsOutput,
  MetricStatus,
} from './types.ts';
import { aggregateBatting } from './aggregateBatting.ts';

export interface TargetBandConfig {
  label: string;
  minTarget: number;
  maxTarget: number;
}

const DEFAULT_TARGET_BANDS: TargetBandConfig[] = [
  { label: '< 200', minTarget: 0, maxTarget: 199 },
  { label: '200–249', minTarget: 200, maxTarget: 249 },
  { label: '250–299', minTarget: 250, maxTarget: 299 },
  { label: '300+', minTarget: 300, maxTarget: Infinity },
];

/**
 * Computes chase metrics for a player across an array of normalized matches.
 */
export function calculateChaseMetrics(
  matches: NormalizedMatch[],
  playerName: string,
  targetBands: TargetBandConfig[] = DEFAULT_TARGET_BANDS
): ChaseMetricsOutput {
  const warnings: string[] = [];

  // All Chases
  const allChasesAgg = aggregateBatting(matches, playerName, {
    inningsFilterCriteria: { isChasing: true },
  });

  // Successful Chases
  const successfulChasesAgg = aggregateBatting(matches, playerName, {
    inningsFilterCriteria: { isSuccessfulChase: true },
  });

  if (allChasesAgg.innings === 0) {
    return {
      status: 'unavailable',
      scope: 'Run Chases',
      inningsCount: 0,
      successfulInningsCount: 0,
      notOuts: 0,
      runs: 0,
      dismissals: 0,
      average: null,
      strikeRate: null,
      successfulChaseAverage: null,
      targetBands: [],
      sampleSize: { matches: 0, innings: 0, balls: 0 },
      warnings: ['No chase innings found in dataset'],
    };
  }

  // Calculate Target Bands
  const bandResults = targetBands.map((band) => {
    // Filter matches where target is in band
    const bandMatches = matches.filter((m) => {
      const chaseInnings = m.innings.find((inn) => inn.inningsNumber === 2 || inn.inningsNumber === 4);
      const target = chaseInnings?.target ?? m.target;
      return target !== undefined && target >= band.minTarget && target <= band.maxTarget;
    });

    const bandAgg = aggregateBatting(bandMatches, playerName, {
      inningsFilterCriteria: { isChasing: true },
    });

    return {
      band: band.label,
      innings: bandAgg.innings,
      runs: bandAgg.runs,
      average: bandAgg.average,
    };
  });

  let status: MetricStatus = 'computed';
  if (allChasesAgg.innings < 5) {
    status = 'insufficient-data';
    warnings.push(`Low chase sample size: only ${allChasesAgg.innings} innings available.`);
  }

  return {
    status,
    scope: 'All Run Chases (2nd / 4th Innings)',
    inningsCount: allChasesAgg.innings,
    successfulInningsCount: successfulChasesAgg.innings,
    notOuts: allChasesAgg.notOuts,
    runs: allChasesAgg.runs,
    dismissals: allChasesAgg.dismissals,
    average: allChasesAgg.average,
    strikeRate: allChasesAgg.strikeRate,
    successfulChaseAverage: successfulChasesAgg.average,
    targetBands: bandResults,
    sampleSize: allChasesAgg.sampleSize,
    warnings,
  };
}

import type {
  NormalizedMatch,
  ClutchIndexOutput,
  ClutchComponentScore,
} from './types.ts';
import { aggregateBatting } from './aggregateBatting.ts';

export const CLUTCH_MODEL_VERSION = '0.1.0-experimental';

/**
 * Editorial hypothesis weights for the Clutch Index model.
 * NOTE: These weights represent working analytical hypotheses, NOT statistically calibrated empirical weights.
 */
export interface ClutchWeights {
  chaseElevation: number;    // default 0.35 (35% weight)
  highPressure: number;      // default 0.25 (25% weight)
  knockoutElevation: number; // default 0.20 (20% weight)
  finalsContribution: number;// default 0.20 (20% weight)
}

export const DEFAULT_CLUTCH_WEIGHTS: ClutchWeights = {
  chaseElevation: 0.35,
  highPressure: 0.25,
  knockoutElevation: 0.20,
  finalsContribution: 0.20,
};

export interface ClutchCalculationOptions {
  weights?: ClutchWeights;
  isProductionDataset?: boolean; // Trust gate: must be true to emit a computed production score
  minInningsThreshold?: number;
}

/**
 * Calculates deterministic Clutch Index from normalized match data.
 */
export function calculateClutchIndexFromMatches(
  matches: NormalizedMatch[],
  playerName: string,
  options: ClutchCalculationOptions = {}
): ClutchIndexOutput {
  const weights = options.weights || DEFAULT_CLUTCH_WEIGHTS;
  const warnings: string[] = [];

  // 1. Overall Baseline
  const baselineAgg = aggregateBatting(matches, playerName);

  // 2. Chasing Splits
  const chaseAgg = aggregateBatting(matches, playerName, {
    inningsFilterCriteria: { isChasing: true },
  });

  // 3. Knockout Splits
  const knockoutAgg = aggregateBatting(matches, playerName, {
    matchFilterCriteria: { isKnockout: true },
  });

  // 4. Finals Splits
  const finalsAgg = aggregateBatting(matches, playerName, {
    matchFilterCriteria: { isFinal: true },
  });

  // Helper to safely score a ratio vs baseline (scaled 0–100, where 1.0 ratio = 70 points)
  function scoreRatio(splitAvg: number | null, baseAvg: number | null): { score: number | null; explanation: string } {
    if (splitAvg === null || baseAvg === null || baseAvg === 0) {
      return { score: null, explanation: 'Insufficient data for baseline comparison' };
    }
    const ratio = splitAvg / baseAvg;
    // ratio 1.0 -> 70 pts; ratio 1.5 -> 95 pts; ratio 0.5 -> 35 pts
    const normalized = Math.min(100, Math.max(0, Math.round(ratio * 70)));
    return {
      score: normalized,
      explanation: `Split avg (${splitAvg.toFixed(1)}) vs Baseline (${baseAvg.toFixed(1)}) = ${ratio.toFixed(2)}x ratio (${normalized}/100)`,
    };
  }

  const chaseScoring = scoreRatio(chaseAgg.average, baselineAgg.average);
  const knockoutScoring = scoreRatio(knockoutAgg.average, baselineAgg.average);
  const finalsScoring = scoreRatio(finalsAgg.average, baselineAgg.average);

  const components: ClutchComponentScore[] = [
    {
      name: 'chaseElevation',
      label: 'Chase Dominance',
      weight: weights.chaseElevation,
      rawValue: chaseAgg.average,
      baselineValue: baselineAgg.average,
      score: chaseScoring.score,
      status: chaseAgg.status,
      explanation: chaseScoring.explanation,
    },
    {
      name: 'highPressure',
      label: 'High-Pressure Situations',
      weight: weights.highPressure,
      rawValue: chaseAgg.strikeRate,
      baselineValue: baselineAgg.strikeRate,
      score: null, // Requires full ball-by-ball chase progression
      status: 'insufficient-data',
      explanation: 'Ball-by-ball situation model calibration pending full historical ball dataset',
    },
    {
      name: 'knockoutElevation',
      label: 'Knockout Elevation',
      weight: weights.knockoutElevation,
      rawValue: knockoutAgg.average,
      baselineValue: baselineAgg.average,
      score: knockoutScoring.score,
      status: knockoutAgg.status,
      explanation: knockoutScoring.explanation,
    },
    {
      name: 'finalsContribution',
      label: 'Finals Impact',
      weight: weights.finalsContribution,
      rawValue: finalsAgg.average,
      baselineValue: baselineAgg.average,
      score: finalsScoring.score,
      status: finalsAgg.status,
      explanation: finalsScoring.explanation,
    },
  ];

  const totalMatches = baselineAgg.matches;
  const totalInnings = baselineAgg.innings;
  const totalBalls = baselineAgg.ballsFaced;

  // Trust Gate: Without explicit verified production dataset flag, maintain calibration-pending status
  if (!options.isProductionDataset) {
    warnings.push('Production dataset not flagged as verified. Clutch Index remains in calibration-pending state.');
    return {
      status: 'calibration-pending',
      modelVersion: CLUTCH_MODEL_VERSION,
      score: null,
      components,
      sampleSize: { matches: totalMatches, innings: totalInnings, balls: totalBalls },
      warnings,
    };
  }

  // Determine overall status
  if (totalInnings === 0) {
    return {
      status: 'insufficient-data',
      modelVersion: CLUTCH_MODEL_VERSION,
      score: null,
      components,
      sampleSize: { matches: 0, innings: 0, balls: 0 },
      warnings: ['No match data supplied'],
    };
  }

  // Check minimum sample size threshold
  if (options.minInningsThreshold && totalInnings < options.minInningsThreshold) {
    warnings.push(`Insufficient sample size (${totalInnings} innings < ${options.minInningsThreshold} required); Clutch Index remains in calibration-pending state.`);
    return {
      status: 'calibration-pending',
      modelVersion: CLUTCH_MODEL_VERSION,
      score: null,
      components,
      sampleSize: { matches: totalMatches, innings: totalInnings, balls: totalBalls },
      warnings,
    };
  }

  // If full career dataset is flagged as production but components are incomplete
  const validScores = components.filter((c) => c.score !== null);
  if (validScores.length < components.length) {
    warnings.push('Incomplete component dataset; overall status remains calibration-pending');
    return {
      status: 'calibration-pending',
      modelVersion: CLUTCH_MODEL_VERSION,
      score: null,
      components,
      sampleSize: { matches: totalMatches, innings: totalInnings, balls: totalBalls },
      warnings,
    };
  }

  // Compute weighted composite score
  let weightedSum = 0;
  let weightTotal = 0;
  for (const comp of components) {
    if (comp.score !== null) {
      weightedSum += comp.score * comp.weight;
      weightTotal += comp.weight;
    }
  }

  const finalScore = weightTotal > 0 ? Number((weightedSum / weightTotal).toFixed(1)) : null;

  return {
    status: 'computed',
    modelVersion: CLUTCH_MODEL_VERSION,
    score: finalScore,
    components,
    sampleSize: { matches: totalMatches, innings: totalInnings, balls: totalBalls },
    warnings,
  };
}

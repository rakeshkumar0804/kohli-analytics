import type {
  NormalizedMatch,
  PressureCellOutput,
  PressureDerivationResult,
  InningsPhase,
  RRRBandId,
  PressureLevel,
  MatchFormat,
  MetricStatus,
  SampleSizeBand,
} from './types.ts';
import { PHASE_POLICY_VERSION } from './normalizeMatch.ts';

export interface PressureBandDefinition {
  rrrBand: RRRBandId;
  pressureLevel: PressureLevel;
  rrrRange: string;
  minRRR: number;
  maxRRR: number;
}

export const FIVE_PRESSURE_BANDS: PressureBandDefinition[] = [
  { rrrBand: 'below-6',  pressureLevel: 'comfortable', rrrRange: '<6 rpo',    minRRR: 0,    maxRRR: 6.0 },
  { rrrBand: '6-to-8',   pressureLevel: 'moderate',    rrrRange: '6–8 rpo',   minRRR: 6.0,  maxRRR: 8.0 },
  { rrrBand: '8-to-10',  pressureLevel: 'stiff',       rrrRange: '8–10 rpo',  minRRR: 8.0,  maxRRR: 10.0 },
  { rrrBand: '10-to-12', pressureLevel: 'severe',      rrrRange: '10–12 rpo', minRRR: 10.0, maxRRR: 12.0 },
  { rrrBand: 'above-12', pressureLevel: 'extreme',     rrrRange: '>12 rpo',   minRRR: 12.0, maxRRR: Infinity },
];

export const PHASES: InningsPhase[] = ['powerplay', 'middle', 'death'];

/**
 * Classifies sample size into deterministic bands.
 * Thresholds: insufficient (<12), limited (12–29), usable (30–59), strong (≥60)
 */
export function classifySampleSize(ballsFaced: number): SampleSizeBand {
  if (ballsFaced < 12) return 'insufficient';
  if (ballsFaced < 30) return 'limited';
  if (ballsFaced < 60) return 'usable';
  return 'strong';
}

/**
 * Derives a full Pressure Map grid (3 Phases × 5 RRR Levels = 15 cells) for a player and format.
 *
 * Test format handling policy (Option B):
 * - Limited-overs required-run-rate grid does not apply to multi-day Test cricket.
 * - Test format returns status 'unsupported-format' with explicit warning notes.
 */
export function derivePressureMap(
  matches: NormalizedMatch[],
  playerName: string,
  format: MatchFormat = 'ODI',
  bands: PressureBandDefinition[] = FIVE_PRESSURE_BANDS
): PressureDerivationResult {
  const warnings: string[] = [];

  if (format === 'Test') {
    return {
      format: 'Test',
      phasePolicyVersion: PHASE_POLICY_VERSION,
      status: 'unsupported-format',
      cells: [],
      warnings: [
        'Test cricket situational pressure model unsupported in limited-overs RRR grid. Test pressure analysis requires session/innings target modeling.',
      ],
    };
  }

  const formatMatches = matches.filter((m) => m.format === format);
  if (formatMatches.length === 0) {
    warnings.push(`No ${format} matches available in supplied dataset.`);
  }

  const targetPlayer = playerName.toLowerCase();
  const cells: PressureCellOutput[] = [];

  for (const band of bands) {
    for (const phase of PHASES) {
      let cellRuns = 0;
      let cellStrikerDeliveries = 0;
      let cellWideDeliveries = 0;
      let cellNoBallDeliveries = 0;
      let cellTeamLegalDeliveries = 0;
      let cellOfficialBatterBallsFaced = 0;
      let cellDismissals = 0;
      let cellDotBalls = 0;
      let cellFours = 0;
      let cellSixes = 0;
      const inningsSeen = new Set<string>();

      for (const match of formatMatches) {
        for (let i = 0; i < match.innings.length; i++) {
          const inn = match.innings[i];
          // Only chase innings with a known target have required run rates
          if (inn.target === undefined && inn.inningsNumber !== 2 && inn.inningsNumber !== 4) {
            continue;
          }

          const inningsKey = `${match.matchId}_inn${inn.inningsNumber}`;

          for (const d of inn.deliveries) {
            // Check if delivery matches phase and RRR range
            if (d.phase !== phase) continue;
            if (d.requiredRunRate === undefined) continue;
            if (d.requiredRunRate < band.minRRR || d.requiredRunRate >= band.maxRRR) continue;

            // Exclude invalid delivery context (balls remaining <= 0 or invalid RRR)
            if (d.ballsRemaining === undefined || d.ballsRemaining <= 0 || isNaN(d.requiredRunRate) || !isFinite(d.requiredRunRate)) {
              continue;
            }

            // Check if player is facing
            if (d.batter.toLowerCase() === targetPlayer) {
              inningsSeen.add(inningsKey);
              cellStrikerDeliveries += 1;
              const isWide = (d.extras?.wides ?? 0) > 0;
              const isNoBall = (d.extras?.noBalls ?? 0) > 0;

              if (isWide) {
                cellWideDeliveries += 1;
              } else {
                cellOfficialBatterBallsFaced += 1;
                cellRuns += d.batterRuns;
                if (d.batterRuns === 0) {
                  cellDotBalls += 1;
                }
                if (d.batterRuns === 4 && !d.nonBoundary) cellFours += 1;
                if (d.batterRuns === 6 && !d.nonBoundary) cellSixes += 1;
              }

              if (isNoBall) {
                cellNoBallDeliveries += 1;
              }

              if (d.isLegal) {
                cellTeamLegalDeliveries += 1;
              }
            }

            // Check if player was dismissed in this situation
            if (d.wicket && d.wicket.playerDismissed.toLowerCase() === targetPlayer) {
              cellDismissals += 1;
            }
          }
        }
      }

      let status: MetricStatus = 'computed';
      if (cellOfficialBatterBallsFaced === 0) {
        status = 'unavailable';
      } else if (cellOfficialBatterBallsFaced < 15 || inningsSeen.size < 3) {
        status = 'insufficient-data';
      }

      let average: number | null = null;
      if (cellDismissals > 0) {
        average = Number((cellRuns / cellDismissals).toFixed(2));
      }

      // Official batting strike rate: batterRuns / officialBatterBallsFaced * 100
      let battingStrikeRate: number | null = null;
      if (cellOfficialBatterBallsFaced > 0) {
        battingStrikeRate = Number(((cellRuns / cellOfficialBatterBallsFaced) * 100).toFixed(2));
      }

      // Explicit scoring rate per 100 team legal deliveries: batterRuns / teamLegalDeliveries * 100
      let scoringRatePer100LegalDeliveries: number | null = null;
      if (cellTeamLegalDeliveries > 0) {
        scoringRatePer100LegalDeliveries = Number(((cellRuns / cellTeamLegalDeliveries) * 100).toFixed(2));
      }

      let dotBallPercentage: number | null = null;
      if (cellOfficialBatterBallsFaced > 0) {
        dotBallPercentage = Number(((cellDotBalls / cellOfficialBatterBallsFaced) * 100).toFixed(2));
      }

      let boundaryPercentage: number | null = null;
      if (cellRuns > 0) {
        const boundaryRuns = cellFours * 4 + cellSixes * 6;
        boundaryPercentage = Number(((boundaryRuns / cellRuns) * 100).toFixed(2));
      }

      cells.push({
        phase,
        rrrBand: band.rrrBand,
        pressureLevel: band.pressureLevel,
        rrrRange: band.rrrRange,
        status,
        sampleSize: {
          inningsCount: inningsSeen.size,
          ballsFaced: cellOfficialBatterBallsFaced,
          teamLegalDeliveries: cellTeamLegalDeliveries,
          strikerDeliveries: cellStrikerDeliveries,
          wideDeliveries: cellWideDeliveries,
          noBallDeliveries: cellNoBallDeliveries,
          officialBatterBallsFaced: cellOfficialBatterBallsFaced,
        },
        sampleSizeBand: classifySampleSize(cellOfficialBatterBallsFaced),
        strikerDeliveries: cellStrikerDeliveries,
        wideDeliveries: cellWideDeliveries,
        noBallDeliveries: cellNoBallDeliveries,
        teamLegalDeliveries: cellTeamLegalDeliveries,
        officialBatterBallsFaced: cellOfficialBatterBallsFaced,
        runs: cellRuns,
        dismissals: cellDismissals,
        fours: cellFours,
        sixes: cellSixes,
        average,
        strikeRate: battingStrikeRate,
        battingStrikeRate,
        scoringRatePer100LegalDeliveries,
        dotBallPercentage,
        boundaryPercentage,
      });
    }
  }

  let overallStatus: MetricStatus = 'computed';
  const computedCount = cells.filter((c) => c.status === 'computed').length;
  if (computedCount === 0) {
    overallStatus = 'unavailable';
  } else if (computedCount < cells.length) {
    overallStatus = 'partial';
  }

  return {
    format,
    phasePolicyVersion: PHASE_POLICY_VERSION,
    status: overallStatus,
    cells,
    warnings,
  };
}

import type {
  NormalizedMatch,
  BattingAggregates,
  MetricStatus,
} from './types.ts';
import { matchFilter, inningsFilter, type MatchFilterCriteria, type InningsFilterCriteria } from './filters.ts';

export interface AggregateOptions {
  matchFilterCriteria?: MatchFilterCriteria;
  inningsFilterCriteria?: InningsFilterCriteria;
}

/**
 * Computes batting aggregates for a player across an array of normalized matches.
 */
export function aggregateBatting(
  matches: NormalizedMatch[],
  playerName: string,
  options: AggregateOptions = {}
): BattingAggregates {
  const targetPlayer = playerName.toLowerCase();
  
  let matchesCount = 0;
  let inningsCount = 0;
  let notOuts = 0;
  let dismissals = 0;
  let totalRuns = 0;
  let ballsFaced = 0;
  let centuries = 0;
  let fifties = 0;
  let ducks = 0;
  let fours = 0;
  let sixes = 0;
  let dotBalls = 0;

  for (const match of matches) {
    if (options.matchFilterCriteria && !matchFilter(match, options.matchFilterCriteria)) {
      continue;
    }

    let playerPlayedInMatch = false;

    for (const inn of match.innings) {
      if (options.inningsFilterCriteria && !inningsFilter(inn, match, options.inningsFilterCriteria)) {
        continue;
      }

      // Check if player batted in this innings
      const playerDeliveries = inn.deliveries.filter((d) => d.batter.toLowerCase() === targetPlayer);
      const isPlayerNonStrikerAtAnyPoint = inn.deliveries.some((d) => d.nonStriker.toLowerCase() === targetPlayer);

      if (playerDeliveries.length === 0 && !isPlayerNonStrikerAtAnyPoint) {
        continue;
      }

      // Player took part in this innings
      playerPlayedInMatch = true;
      inningsCount += 1;

      let inningsRuns = 0;
      let inningsBalls = 0;
      let wasDismissed = false;

      for (const d of inn.deliveries) {
        if (d.batter.toLowerCase() === targetPlayer) {
          inningsRuns += d.batterRuns;
          const isWide = (d.extras?.wides ?? 0) > 0;
          if (!isWide) {
            inningsBalls += 1;
            if (d.batterRuns === 0) {
              dotBalls += 1;
            }
          }
          if (d.batterRuns === 4 && !d.nonBoundary) fours += 1;
          if (d.batterRuns === 6 && !d.nonBoundary) sixes += 1;
        }

        // Check if player was dismissed (either as striker or non-striker in run-out)
        if (d.wicket && d.wicket.playerDismissed.toLowerCase() === targetPlayer) {
          wasDismissed = true;
        }
      }

      totalRuns += inningsRuns;
      ballsFaced += inningsBalls;

      if (wasDismissed) {
        dismissals += 1;
        if (inningsRuns === 0) {
          ducks += 1;
        }
      } else {
        notOuts += 1;
      }

      if (inningsRuns >= 100) {
        centuries += 1;
      } else if (inningsRuns >= 50) {
        fifties += 1;
      }
    }

    if (playerPlayedInMatch) {
      matchesCount += 1;
    }
  }

  let status: MetricStatus = 'computed';
  if (inningsCount === 0) {
    status = 'unavailable';
  } else if (inningsCount < 5) {
    status = 'insufficient-data';
  }

  let average: number | null = null;
  if (dismissals > 0) {
    average = Number((totalRuns / dismissals).toFixed(2));
  }

  let strikeRate: number | null = null;
  if (ballsFaced > 0) {
    strikeRate = Number(((totalRuns / ballsFaced) * 100).toFixed(2));
  }

  let dotBallPercentage: number | null = null;
  if (ballsFaced > 0) {
    dotBallPercentage = Number(((dotBalls / ballsFaced) * 100).toFixed(2));
  }

  let boundaryPercentage: number | null = null;
  if (totalRuns > 0) {
    const boundaryRuns = fours * 4 + sixes * 6;
    boundaryPercentage = Number(((boundaryRuns / totalRuns) * 100).toFixed(2));
  }

  return {
    matches: matchesCount,
    innings: inningsCount,
    notOuts,
    dismissals,
    runs: totalRuns,
    ballsFaced,
    average,
    strikeRate,
    centuries,
    fifties,
    ducks,
    fours,
    sixes,
    dotBalls,
    dotBallPercentage,
    boundaryPercentage,
    status,
    sampleSize: {
      matches: matchesCount,
      innings: inningsCount,
      balls: ballsFaced,
    },
  };
}

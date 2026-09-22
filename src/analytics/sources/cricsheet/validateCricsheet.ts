import type { NormalizedMatch } from '../../types.ts';

export interface QualityGateResults {
  isTrusted: boolean;
  totalMatchesEvaluated: number;
  validMatches: number;
  rejectedMatches: number;
  duplicateMatchIds: string[];
  identityResolutionStats: {
    registryMatches: number;
    aliasMatches: number;
    normalizedNameMatches: number;
    unresolvedCount: number;
  };
  reconciliationIssues: Array<{
    matchId: string;
    issue: string;
    severity: 'error' | 'warning';
  }>;
  formatCounts: Record<string, number>;
  stageCounts: Record<string, number>;
  blockingFailures: string[];
}

/**
 * Executes comprehensive data-quality gates on parsed normalized matches.
 */
export function validateCricsheetDataset(matches: NormalizedMatch[]): QualityGateResults {
  const duplicateMatchIds: string[] = [];
  const seenIds = new Set<string>();
  const reconciliationIssues: QualityGateResults['reconciliationIssues'] = [];
  const blockingFailures: string[] = [];

  const formatCounts: Record<string, number> = {};
  const stageCounts: Record<string, number> = {};

  let validMatches = 0;
  let rejectedMatches = 0;

  for (const m of matches) {
    if (seenIds.has(m.matchId)) {
      duplicateMatchIds.push(m.matchId);
      reconciliationIssues.push({ matchId: m.matchId, issue: `Duplicate match ID ${m.matchId}`, severity: 'error' });
    }
    seenIds.add(m.matchId);

    // Track formats and stages
    formatCounts[m.format] = (formatCounts[m.format] || 0) + 1;
    stageCounts[m.stage] = (stageCounts[m.stage] || 0) + 1;

    // Validate teams
    if (!m.teams || m.teams.length !== 2 || !m.teams[0] || !m.teams[1] || m.teams[0] === m.teams[1]) {
      reconciliationIssues.push({ matchId: m.matchId, issue: 'Invalid teams array', severity: 'error' });
      rejectedMatches += 1;
      continue;
    }

    // Validate date format (YYYY-MM-DD or YYYY)
    if (!m.date || !/^\d{4}(-\d{2}-\d{2})?/.test(m.date)) {
      reconciliationIssues.push({ matchId: m.matchId, issue: `Invalid match date '${m.date}'`, severity: 'error' });
      rejectedMatches += 1;
      continue;
    }

    // Validate innings delivery totals vs innings totals
    let matchHasError = false;
    for (const inn of m.innings) {
      let sumRuns = 0;
      let sumLegal = 0;
      let sumWickets = 0;

      for (const del of inn.deliveries) {
        sumRuns += del.totalRuns;
        if (del.isLegal) sumLegal += 1;
        if (del.wicket) sumWickets += 1;

        if (del.batterRuns < 0 || (del.extras.wides ?? 0) < 0 || (del.extras.noBalls ?? 0) < 0) {
          reconciliationIssues.push({ matchId: m.matchId, issue: `Negative runs or extras in innings ${inn.inningsNumber}`, severity: 'error' });
          matchHasError = true;
          break;
        }
      }

      if (sumRuns !== inn.totalRuns || sumLegal !== inn.totalLegalBalls || sumWickets !== inn.totalWickets) {
        reconciliationIssues.push({
          matchId: m.matchId,
          issue: `Innings ${inn.inningsNumber} total mismatch: runs ${sumRuns} vs ${inn.totalRuns}, balls ${sumLegal} vs ${inn.totalLegalBalls}, wkts ${sumWickets} vs ${inn.totalWickets}`,
          severity: 'error',
        });
        matchHasError = true;
      }
    }

    if (matchHasError) {
      rejectedMatches += 1;
    } else {
      validMatches += 1;
    }
  }

  if (duplicateMatchIds.length > 0) {
    blockingFailures.push(`Found ${duplicateMatchIds.length} duplicate match IDs: ${duplicateMatchIds.slice(0, 5).join(', ')}`);
  }

  const isTrusted = blockingFailures.length === 0 && rejectedMatches === 0 && validMatches > 0;

  return {
    isTrusted,
    totalMatchesEvaluated: matches.length,
    validMatches,
    rejectedMatches,
    duplicateMatchIds,
    identityResolutionStats: {
      registryMatches: 0,
      aliasMatches: 0,
      normalizedNameMatches: 0,
      unresolvedCount: 0,
    },
    reconciliationIssues,
    formatCounts,
    stageCounts,
    blockingFailures,
  };
}

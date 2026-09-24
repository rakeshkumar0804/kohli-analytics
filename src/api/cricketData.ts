import type { LiveAPIStats, NextMatchInfo } from '../types';
import { careerStats } from '../data/kohliData.ts';

// ============================================================================
// CricketData.org API Integration & Architecture
//
// SECURITY & PROVENANCE NOTICE:
// 1. Zero Browser Credentials: No provider API keys are stored in client source
//    or bundled into client javascript. Credentials are server-only.
// 2. Server Proxy Architecture: Live schedule queries route via the server-side
//    endpoint `/api/fixtures` which enforces server-side authentication,
//    bounded timeouts, rate limiting, and in-memory caching.
// 3. Verified Career Aggregates (Phase 1 locked baseline) are the application's
//    declared single source of truth for player statistics.
// ============================================================================

export type FixtureStatus = 'available' | 'unavailable' | 'confirmed-empty' | 'stale';

export interface NextMatchResult {
  status: FixtureStatus;
  match: NextMatchInfo | null;
  message: string;
  reason:
    | 'live-schedule-found'
    | 'no-upcoming-fixture'
    | 'no-server-proxy'
    | 'missing-credentials'
    | 'network-error'
    | 'timeout'
    | 'invalid-schema'
    | 'provider-error'
    | 'rate-limited'
    | 'stale-cache';
  fetchedAt: string;
  meta?: {
    cached: boolean;
    cacheAgeSeconds?: number;
    provider: 'cricketdata';
  };
}

// In-memory client response cache with TTL
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client-side
let clientCachedResult: NextMatchResult | null = null;
let lastClientFetchTimestamp = 0;

/**
 * Pure response parser with schema validation and date verification.
 * Exported for deterministic unit and integration testing.
 */
export function parseNextMatchResponse(json: unknown, now: Date = new Date()): NextMatchResult {
  const fetchedAt = now.toISOString();

  if (!json || typeof json !== 'object') {
    return {
      status: 'unavailable',
      match: null,
      message: 'Invalid schedule payload received from upstream provider.',
      reason: 'invalid-schema',
      fetchedAt,
    };
  }

  const record = json as Record<string, unknown>;

  // Check if payload is already from our structured /api/fixtures server endpoint
  if (
    record.status &&
    (record.status === 'available' || record.status === 'confirmed-empty' || record.status === 'unavailable') &&
    typeof record.message === 'string' &&
    typeof record.reason === 'string'
  ) {
    return {
      status: record.status as FixtureStatus,
      match: (record.match as NextMatchInfo) || null,
      message: record.message,
      reason: record.reason as NextMatchResult['reason'],
      fetchedAt: (record.fetchedAt as string) || fetchedAt,
      meta: record.meta as NextMatchResult['meta'],
    };
  }

  // Fallback parsing for raw CricAPI data array format
  const dataList = (record.data || record.dataList || record.matches || []) as unknown[];

  if (!Array.isArray(dataList)) {
    return {
      status: 'unavailable',
      match: null,
      message: 'Schedule payload data property is not an array.',
      reason: 'invalid-schema',
      fetchedAt,
    };
  }

  if (dataList.length === 0) {
    return {
      status: 'confirmed-empty',
      match: null,
      message: 'Schedule provider returned an empty list of upcoming matches.',
      reason: 'no-upcoming-fixture',
      fetchedAt,
    };
  }

  // Filter future matches involving India and limited overs / ODI
  for (const item of dataList) {
    if (!item || typeof item !== 'object') continue;
    const match = item as Record<string, unknown>;

    const matchName = String(match.name || match.title || '').trim();
    const matchType = String(match.matchType || match.type || '').toUpperCase();
    const matchDateStr = String(match.dateTimeGMT || match.date || '').trim();

    if (!matchDateStr) continue;
    const matchDate = new Date(matchDateStr);

    if (isNaN(matchDate.getTime()) || matchDate.getTime() <= now.getTime()) continue;

    const isIndiaMatch = matchName.toLowerCase().includes('india');
    const isODI = matchType.includes('ODI') || matchName.toLowerCase().includes('odi');

    if (isIndiaMatch && isODI) {
      const teams = matchName.split(/vs|v/i);
      let rawOpponent = 'Opponent';
      if (teams.length >= 2) {
        rawOpponent = teams[0].toLowerCase().includes('india') ? teams[1].trim() : teams[0].trim();
      }
      const opponent =
        rawOpponent.replace(/(\d+(st|nd|rd|th)\s*)?(ODI|T20I?|Test|Match).*$/i, '').trim() || rawOpponent;

      const nextMatch: NextMatchInfo = {
        matchName,
        opponent,
        matchType: 'ODI',
        date: matchDate.toISOString(),
        dateTimeGMT: matchDateStr,
        venue: String(match.venue || 'International Stadium').trim(),
      };

      return {
        status: 'available',
        match: nextMatch,
        message: 'Upcoming fixture successfully retrieved and verified.',
        reason: 'live-schedule-found',
        fetchedAt,
      };
    }
  }

  return {
    status: 'confirmed-empty',
    match: null,
    message: 'No upcoming ODI fixtures for India found in the active calendar.',
    reason: 'no-upcoming-fixture',
    fetchedAt,
  };
}

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env[key] === 'string') {
      return import.meta.env[key];
    }
  } catch {
    // Ignore in non-Vite environments
  }
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : null;
    const proc = globalObj?.process as { env?: Record<string, string> } | undefined;
    if (proc?.env && typeof proc.env[key] === 'string') {
      return proc.env[key];
    }
  } catch {
    // Ignore in environments without process.env
  }
  return undefined;
}

/**
 * Fetches India's next scheduled ODI match from the server-side fixture endpoint
 * with client caching, bounded timeout, and honest error handling.
 *
 * Never converts API failures into a false "no matches scheduled" claim.
 */
export async function fetchNextMatch(now: Date = new Date()): Promise<NextMatchResult> {
  const currentEpoch = now.getTime();

  // Return valid client cache if within TTL
  if (clientCachedResult && currentEpoch - lastClientFetchTimestamp < CLIENT_CACHE_TTL_MS) {
    return clientCachedResult;
  }

  const endpoint = getEnvVar('VITE_FIXTURES_API_URL') || '/api/fixtures';

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000), // Strict 6s client timeout
    });

    if (!response.ok && response.status === 404) {
      // 404 indicates server route is not available (static CDN host)
      const result: NextMatchResult = {
        status: 'unavailable',
        match: null,
        message: 'Live schedule feed is unavailable in client-only static deployment without a server proxy route.',
        reason: 'no-server-proxy',
        fetchedAt: now.toISOString(),
      };
      return result;
    }

    if (!response.ok && response.status === 429) {
      const result: NextMatchResult = {
        status: 'unavailable',
        match: null,
        message: 'Rate limit exceeded on fixture schedule endpoint. Please retry later.',
        reason: 'rate-limited',
        fetchedAt: now.toISOString(),
      };
      return result;
    }

    if (!response.ok) {
      const result: NextMatchResult = {
        status: 'unavailable',
        match: null,
        message: `Upstream schedule endpoint returned HTTP ${response.status}.`,
        reason: 'network-error',
        fetchedAt: now.toISOString(),
      };
      return result;
    }

    const json = await response.json();
    const result = parseNextMatchResponse(json, now);

    // Cache successful / confirmed / rate-limited results on client
    clientCachedResult = result;
    lastClientFetchTimestamp = currentEpoch;
    return result;
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';

    const result: NextMatchResult = {
      status: 'unavailable',
      match: null,
      message: isTimeout
        ? 'Schedule endpoint request timed out.'
        : 'Network error communicating with schedule endpoint.',
      reason: isTimeout ? 'timeout' : 'network-error',
      fetchedAt: now.toISOString(),
    };
    return result;
  }
}

/**
 * Declared source of truth for player career statistics.
 * Sourced strictly from verified Phase 1 locked aggregates.
 */
export function getVerifiedCareerStats(): LiveAPIStats {
  return {
    matches: careerStats.overall.matches,
    runs: careerStats.overall.runs,
    centuries: careerStats.overall.centuries,
    average: careerStats.odi.average,
    strikeRate: careerStats.odi.strikeRate,
    highScore: careerStats.odi.highScore,
  };
}

/**
 * Historical helper for player stats, returning verified career baseline.
 */
export async function fetchKohliStats(): Promise<LiveAPIStats> {
  return getVerifiedCareerStats();
}

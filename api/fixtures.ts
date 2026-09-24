import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * ============================================================================
 * Vercel Serverless Function Handler for /api/fixtures
 * ============================================================================
 * Self-contained serverless proxy handler with zero runtime import dependencies
 * to guarantee 100% compatibility across all Vercel Node/Serverless execution environments.
 */

export interface SanitizedFixture {
  matchName: string;
  opponent: string;
  matchType: string;
  date: string; // ISO 8601 string
  dateTimeGMT: string;
  venue: string;
  series?: string;
}

export type FixtureStatus = 'available' | 'confirmed-empty' | 'unavailable';

export type FixtureReason =
  | 'live-schedule-found'
  | 'no-upcoming-fixture'
  | 'missing-credentials'
  | 'network-error'
  | 'timeout'
  | 'invalid-schema'
  | 'provider-error'
  | 'rate-limited';

export interface FixturesApiResponse {
  status: FixtureStatus;
  match: SanitizedFixture | null;
  message: string;
  reason: FixtureReason;
  fetchedAt: string;
  meta: {
    cached: boolean;
    cacheAgeSeconds?: number;
    provider: 'cricketdata';
  };
}

export interface FixtureServiceOptions {
  apiKey?: string;
  cacheTtlMs?: number;
  rateLimitWindowMs?: number;
  maxRequestsPerWindow?: number;
  requestTimeoutMs?: number;
  fetchFn?: typeof fetch;
  nowFn?: () => Date;
}

interface CacheEntry {
  response: FixturesApiResponse;
  timestamp: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

export class FixturesService {
  private apiKey: string | undefined;
  private cacheTtlMs: number;
  private rateLimitWindowMs: number;
  private maxRequestsPerWindow: number;
  private requestTimeoutMs: number;
  private fetchFn: typeof fetch;
  private nowFn: () => Date;

  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheEntries = 100;

  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private maxRateLimitEntries = 1000;

  constructor(options: FixtureServiceOptions = {}) {
    const getEnv = (key: string): string | undefined => {
      try {
        const g = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : null;
        const p = g?.process as { env?: Record<string, string> } | undefined;
        return p?.env?.[key];
      } catch {
        return undefined;
      }
    };

    const rawKey =
      options.apiKey ??
      getEnv('CRICKETDATA_API_KEY') ??
      getEnv('CRICAPI_KEY') ??
      getEnv('CRICKET_DATA_API_KEY');

    this.apiKey = rawKey ? rawKey.replace(/^[<"'\s]+|[>"'\s]+$/g, '').trim() : undefined;
    this.cacheTtlMs = options.cacheTtlMs ?? 15 * 60 * 1000;
    this.rateLimitWindowMs = options.rateLimitWindowMs ?? 60 * 1000;
    this.maxRequestsPerWindow = options.maxRequestsPerWindow ?? 30;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 8000;
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.nowFn = options.nowFn ?? (() => new Date());
  }

  public checkRateLimit(clientIp: string = 'unknown'): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
  } {
    const now = this.nowFn().getTime();
    const windowStart = now - this.rateLimitWindowMs;

    let entry = this.rateLimits.get(clientIp);
    if (!entry) {
      if (this.rateLimits.size >= this.maxRateLimitEntries) {
        const firstKey = this.rateLimits.keys().next().value;
        if (firstKey) this.rateLimits.delete(firstKey);
      }
      entry = { timestamps: [] };
      this.rateLimits.set(clientIp, entry);
    }

    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.maxRequestsPerWindow) {
      const oldestInWindow = entry.timestamps[0] || now;
      const resetMs = Math.max(0, oldestInWindow + this.rateLimitWindowMs - now);
      return {
        allowed: false,
        limit: this.maxRequestsPerWindow,
        remaining: 0,
        resetMs,
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      limit: this.maxRequestsPerWindow,
      remaining: this.maxRequestsPerWindow - entry.timestamps.length,
      resetMs: this.rateLimitWindowMs,
    };
  }

  public parseProviderPayload(json: unknown, now: Date = this.nowFn()): Omit<FixturesApiResponse, 'meta'> {
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

    if (record.status === 'failure' || record.status === 'error') {
      return {
        status: 'unavailable',
        match: null,
        message: 'Upstream schedule provider reported an error.',
        reason: 'provider-error',
        fetchedAt,
      };
    }

    const dataList = (record.data || record.dataList || record.matches || record.matchList || []) as unknown[];

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

    const upcomingIndiaODIs: Array<SanitizedFixture & { timestamp: number }> = [];

    for (const item of dataList) {
      if (!item || typeof item !== 'object') continue;
      const match = item as Record<string, unknown>;

      const matchName = String(match.name || match.title || '').trim();
      const matchType = String(match.matchType || match.type || '').toUpperCase();
      const matchDateStr = String(match.dateTimeGMT || match.date || '').trim();
      const series = match.series ? String(match.series).trim() : undefined;

      if (!matchDateStr) continue;
      const normalizedDateStr =
        matchDateStr.includes('T') && !matchDateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(matchDateStr)
          ? `${matchDateStr}Z`
          : matchDateStr;
      const matchDate = new Date(normalizedDateStr);

      if (isNaN(matchDate.getTime()) || matchDate.getTime() <= now.getTime()) continue;

      const teamsArr: string[] = Array.isArray(match.teams)
        ? (match.teams as string[]).map((t) => String(t).trim())
        : [];
      const teamInfoArr: Array<{ name?: string; shortname?: string }> = Array.isArray(match.teamInfo)
        ? (match.teamInfo as Array<{ name?: string; shortname?: string }>)
        : [];

      const hasIndiaInTeams =
        teamsArr.some((t) => /\bindia\b/i.test(t)) ||
        teamInfoArr.some((ti) => (ti.name && /\bindia\b/i.test(ti.name)) || (ti.shortname && /^ind$/i.test(ti.shortname)));

      const isIndiaMatch = hasIndiaInTeams || /\bindia\b/i.test(matchName);
      const isExcludedContext =
        /\b(women|u19|under-19|u-19|lions)\b/i.test(matchName) ||
        (series ? /\b(women|u19|under-19|u-19|lions)\b/i.test(series) : false);

      const isT20OrTest = /\b(t20|twenty20|test)\b/i.test(matchName);
      const isODI =
        (matchType === 'ODI' || matchType.includes('ODI') || /\bodi\b|\bone[\s-]day\b/i.test(matchName)) &&
        !isExcludedContext &&
        !isT20OrTest;

      if (isIndiaMatch && isODI) {
        let opponent = 'Opponent';
        const nonIndiaTeam = teamsArr.find((t) => !/\bindia\b/i.test(t));
        const nonIndiaInfo = teamInfoArr.find((ti) => !/\bindia\b/i.test(ti.name || '') && !/^ind$/i.test(ti.shortname || ''));

        if (nonIndiaTeam) {
          opponent = nonIndiaTeam;
        } else if (nonIndiaInfo && nonIndiaInfo.name) {
          opponent = nonIndiaInfo.name;
        } else {
          const splitTeams = matchName.split(/vs|v\b/i);
          if (splitTeams.length >= 2) {
            const rawOpp = splitTeams[0].toLowerCase().includes('india') ? splitTeams[1].trim() : splitTeams[0].trim();
            opponent = rawOpp.replace(/(\d+(st|nd|rd|th)\s*)?(ODI|T20I?|Test|Match).*$/i, '').trim() || rawOpp;
          }
        }

        upcomingIndiaODIs.push({
          matchName,
          opponent,
          matchType: 'ODI',
          date: matchDate.toISOString(),
          dateTimeGMT: matchDateStr,
          venue: String(match.venue || 'International Stadium').trim(),
          ...(series ? { series } : {}),
          timestamp: matchDate.getTime(),
        });
      }
    }

    if (upcomingIndiaODIs.length > 0) {
      upcomingIndiaODIs.sort((a, b) => a.timestamp - b.timestamp);
      const { timestamp: _t, ...closestMatch } = upcomingIndiaODIs[0];

      return {
        status: 'available',
        match: closestMatch,
        message: 'Upcoming fixture successfully retrieved and verified.',
        reason: 'live-schedule-found',
        fetchedAt,
      };
    }

    return {
      status: 'confirmed-empty',
      match: null,
      message: 'No upcoming ODI fixtures for India found in the active calendar.',
      reason: 'no-upcoming-fixture',
      fetchedAt,
    };
  }

  public async getNextFixture(options: {
    clientIp?: string;
    bypassCache?: boolean;
  } = {}): Promise<{
    httpStatus: number;
    headers: Record<string, string>;
    body: FixturesApiResponse;
  }> {
    const now = this.nowFn();
    const clientIp = options.clientIp || '127.0.0.1';

    const rateLimit = this.checkRateLimit(clientIp);
    const rateHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetMs / 1000)),
    };

    if (!rateLimit.allowed) {
      return {
        httpStatus: 429,
        headers: {
          ...rateHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
        },
        body: {
          status: 'unavailable',
          match: null,
          message: 'Too many fixture requests. Rate limit exceeded.',
          reason: 'rate-limited',
          fetchedAt: now.toISOString(),
          meta: {
            cached: false,
            provider: 'cricketdata',
          },
        },
      };
    }

    const cacheKey = 'india-odi-next-match';
    const cached = this.cache.get(cacheKey);

    if (!options.bypassCache && cached && now.getTime() - cached.timestamp < this.cacheTtlMs) {
      const ageSeconds = Math.floor((now.getTime() - cached.timestamp) / 1000);
      return {
        httpStatus: 200,
        headers: {
          ...rateHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.floor((this.cacheTtlMs - (now.getTime() - cached.timestamp)) / 1000)}`,
          'X-Cache': 'HIT',
          Age: String(ageSeconds),
        },
        body: {
          ...cached.response,
          meta: {
            cached: true,
            cacheAgeSeconds: ageSeconds,
            provider: 'cricketdata',
          },
        },
      };
    }

    if (!this.apiKey || this.apiKey.trim().length === 0) {
      return {
        httpStatus: 200,
        headers: {
          ...rateHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Cache': 'MISS',
        },
        body: {
          status: 'unavailable',
          match: null,
          message: 'Live schedule feed unavailable: Server API key is not configured.',
          reason: 'missing-credentials',
          fetchedAt: now.toISOString(),
          meta: {
            cached: false,
            provider: 'cricketdata',
          },
        },
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      const allCandidateMatches: unknown[] = [];
      let hadSuccessfulFetch = false;
      let hadProviderError = false;

      // Strategy A: Query active series involving India
      try {
        const seriesUrl = `https://api.cricapi.com/v1/series?apikey=${encodeURIComponent(this.apiKey)}&search=India`;
        const seriesRes = await this.fetchFn(seriesUrl, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!seriesRes.ok) {
          hadSuccessfulFetch = true;
          hadProviderError = true;
        } else {
          hadSuccessfulFetch = true;
          const seriesJson = (await seriesRes.json()) as Record<string, unknown>;
          if (seriesJson.status === 'failure' || seriesJson.status === 'error') {
            hadProviderError = true;
          } else {
            const seriesList = Array.isArray(seriesJson?.data) ? (seriesJson.data as Array<Record<string, unknown>>) : [];

            const directMatches = seriesList.filter((item) => item && (item.dateTimeGMT || item.matchType));
            if (directMatches.length > 0) {
              allCandidateMatches.push(...directMatches);
            }

            const odiSeries = seriesList.filter((s) => {
              const name = String(s.name || '');
              const odiCount = Number(s.odi || 0);
              const isExcluded = /\b(women|u19|under-19|u-19|lions)\b/i.test(name);
              return odiCount > 0 && !isExcluded;
            });

            if (odiSeries.length > 0) {
              const seriesInfoPromises = odiSeries.slice(0, 6).map(async (s) => {
                const seriesId = String(s.id || '');
                if (!seriesId) return [];
                try {
                  const infoUrl = `https://api.cricapi.com/v1/series_info?apikey=${encodeURIComponent(this.apiKey!)}&id=${encodeURIComponent(seriesId)}`;
                  const infoRes = await this.fetchFn(infoUrl, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                  });
                  if (infoRes.ok) {
                    const infoJson = (await infoRes.json()) as Record<string, unknown>;
                    const infoData = infoJson?.data as Record<string, unknown> | undefined;
                    const matchList = infoData?.matchList;
                    if (Array.isArray(matchList)) {
                      return matchList.map((m) => ({ ...(m as object), series: s.name }));
                    }
                  }
                } catch (sErr) {
                  if (controller.signal.aborted || (sErr instanceof Error && sErr.name === 'AbortError')) {
                    throw sErr;
                  }
                }
                return [];
              });

              const seriesResults = await Promise.allSettled(seriesInfoPromises);
              for (const res of seriesResults) {
                if (res.status === 'fulfilled') {
                  allCandidateMatches.push(...res.value);
                }
              }
            }
          }
        }
      } catch (seriesErr: unknown) {
        if (controller.signal.aborted || (seriesErr instanceof Error && (seriesErr.name === 'AbortError' || seriesErr.message.includes('abort')))) {
          throw seriesErr;
        }
        console.warn('[FixturesService] Series fetch error:', seriesErr);
      }

      if (hadProviderError) {
        return {
          httpStatus: 200,
          headers: {
            ...rateHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'X-Cache': 'MISS',
          },
          body: {
            status: 'unavailable',
            match: null,
            message: 'Upstream schedule provider reported an error.',
            reason: 'provider-error',
            fetchedAt: now.toISOString(),
            meta: {
              cached: false,
              provider: 'cricketdata',
            },
          },
        };
      }

      const candidateCheck = this.parseProviderPayload({ data: allCandidateMatches }, now);
      if (candidateCheck.status !== 'available') {
        try {
          const currentMatchesUrl = `https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(this.apiKey)}`;
          const cmRes = await this.fetchFn(currentMatchesUrl, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (cmRes.ok) {
            hadSuccessfulFetch = true;
            const cmJson = (await cmRes.json()) as Record<string, unknown>;
            if (Array.isArray(cmJson?.data)) {
              allCandidateMatches.push(...cmJson.data);
            }
          }
        } catch (cmErr: unknown) {
          if (controller.signal.aborted || (cmErr instanceof Error && (cmErr.name === 'AbortError' || cmErr.message.includes('abort')))) {
            throw cmErr;
          }
          console.warn('[FixturesService] currentMatches fetch error:', cmErr);
        }

        if (allCandidateMatches.length === 0) {
          try {
            const matchesUrl = `https://api.cricapi.com/v1/matches?apikey=${encodeURIComponent(this.apiKey)}`;
            const mRes = await this.fetchFn(matchesUrl, {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            });
            if (mRes.ok) {
              hadSuccessfulFetch = true;
              const mJson = (await mRes.json()) as Record<string, unknown>;
              if (Array.isArray(mJson?.data)) {
                allCandidateMatches.push(...mJson.data);
              }
            }
          } catch (mErr: unknown) {
            if (controller.signal.aborted || (mErr instanceof Error && (mErr.name === 'AbortError' || mErr.message.includes('abort')))) {
              throw mErr;
            }
            console.warn('[FixturesService] matches fetch error:', mErr);
          }
        }
      }

      clearTimeout(timeoutId);

      if (controller.signal.aborted) {
        const timeoutErr = new Error('The operation was aborted');
        timeoutErr.name = 'AbortError';
        throw timeoutErr;
      }

      if (!hadSuccessfulFetch && allCandidateMatches.length === 0) {
        return {
          httpStatus: 200,
          headers: {
            ...rateHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'X-Cache': 'MISS',
          },
          body: {
            status: 'unavailable',
            match: null,
            message: 'Upstream schedule provider returned an error response.',
            reason: 'provider-error',
            fetchedAt: now.toISOString(),
            meta: {
              cached: false,
              provider: 'cricketdata',
            },
          },
        };
      }

      const parsed = this.parseProviderPayload({ data: allCandidateMatches }, now);

      const responseBody: FixturesApiResponse = {
        ...parsed,
        meta: {
          cached: false,
          provider: 'cricketdata',
        },
      };

      if (parsed.status === 'available' || parsed.status === 'confirmed-empty') {
        if (this.cache.size >= this.maxCacheEntries) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, {
          response: responseBody,
          timestamp: now.getTime(),
        });
      }

      return {
        httpStatus: 200,
        headers: {
          ...rateHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.floor(this.cacheTtlMs / 1000)}`,
          'X-Cache': 'MISS',
        },
        body: responseBody,
      };
    } catch (error: unknown) {
      const isAbortOrTimeout =
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message.includes('abort'));

      console.error(
        `[FixturesService] Exception during upstream fetch: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        httpStatus: 200,
        headers: {
          ...rateHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Cache': 'MISS',
        },
        body: {
          status: 'unavailable',
          match: null,
          message: isAbortOrTimeout
            ? `Schedule provider request timed out (${Math.floor(this.requestTimeoutMs / 1000)}s limit exceeded).`
            : 'Network error communicating with upstream schedule provider.',
          reason: isAbortOrTimeout ? 'timeout' : 'network-error',
          fetchedAt: now.toISOString(),
          meta: {
            cached: false,
            provider: 'cricketdata',
          },
        },
      };
    }
  }
}

const serviceInstance = new FixturesService();

/**
 * Vercel Serverless Function Handler for /api/fixtures
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'GET, HEAD');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || '127.0.0.1';

    const bypassCache = req.headers['cache-control'] === 'no-cache';

    const result = await serviceInstance.getNextFixture({
      clientIp,
      bypassCache,
    });

    res.statusCode = result.httpStatus;
    for (const [header, value] of Object.entries(result.headers)) {
      res.setHeader(header, value);
    }

    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(JSON.stringify(result.body));
    }
  } catch (err: unknown) {
    console.error('[api/fixtures] Unhandled error in serverless handler:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        status: 'unavailable',
        match: null,
        message: 'Server-side fixture proxy encountered an unexpected internal error.',
        reason: 'network-error',
        fetchedAt: new Date().toISOString(),
        meta: {
          cached: false,
          provider: 'cricketdata',
        },
      })
    );
  }
}

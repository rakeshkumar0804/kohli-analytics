/**
 * ============================================================================
 * Server-Side Fixture Service & Proxy Handler
 * ============================================================================
 *
 * ARCHITECTURE & SECURITY SPECIFICATION:
 * 1. Server-Only Credentials: Reads CRICKETDATA_API_KEY (or CRICAPI_KEY /
 *    CRICKET_DATA_API_KEY) strictly from server process environment. Never
 *    accessible to browser bundles or client-side runtime.
 * 2. Field Sanitization: Whitelists and returns ONLY the minimal fixture fields
 *    required by the UI (opponent, matchName, matchType, venue, date).
 * 3. Robust Error Masking: Catches network, timeout, schema, and provider errors
 *    without exposing upstream error payloads, URLs, or credentials.
 * 4. Bounded In-Memory Cache: LRU/TTL cache (default 15 mins, max 100 entries)
 *    to minimize third-party API consumption and stay within quota.
 * 5. In-Memory Rate Limiting: Sliding-window rate limiter per client IP
 *    (default 30 req/min, max 1,000 tracked IPs). Note: in multi-instance
 *    or serverless environments, state is scoped per process/instance.
 * ============================================================================
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

  // In-memory bounded cache
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheEntries = 100;

  // In-memory bounded rate limiter
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

    this.apiKey =
      options.apiKey ??
      getEnv('CRICKETDATA_API_KEY') ??
      getEnv('CRICAPI_KEY') ??
      getEnv('CRICKET_DATA_API_KEY');

    this.cacheTtlMs = options.cacheTtlMs ?? 15 * 60 * 1000; // 15 minutes
    this.rateLimitWindowMs = options.rateLimitWindowMs ?? 60 * 1000; // 1 minute
    this.maxRequestsPerWindow = options.maxRequestsPerWindow ?? 30; // 30 req/min
    this.requestTimeoutMs = options.requestTimeoutMs ?? 5000; // 5 seconds
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.nowFn = options.nowFn ?? (() => new Date());
  }

  /**
   * Clears internal cache and rate limiter states (useful for testing).
   */
  public clearCache(): void {
    this.cache.clear();
    this.rateLimits.clear();
  }

  /**
   * Sets or overrides the server-side API key.
   */
  public setApiKey(key: string | undefined): void {
    this.apiKey = key;
  }

  /**
   * Evaluates in-memory rate limiting for a client IP.
   */
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
        // Evict oldest entry
        const firstKey = this.rateLimits.keys().next().value;
        if (firstKey) this.rateLimits.delete(firstKey);
      }
      entry = { timestamps: [] };
      this.rateLimits.set(clientIp, entry);
    }

    // Filter out timestamps older than the active window
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

  /**
   * Parses raw provider payload into sanitized fixture result.
   */
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

    // Handle upstream error indicators without exposing sensitive info
    if (record.status === 'failure' || record.status === 'error') {
      return {
        status: 'unavailable',
        match: null,
        message: 'Upstream schedule provider reported an error.',
        reason: 'provider-error',
        fetchedAt,
      };
    }

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

    // Find upcoming India ODI match
    for (const item of dataList) {
      if (!item || typeof item !== 'object') continue;
      const match = item as Record<string, unknown>;

      const matchName = String(match.name || match.title || '').trim();
      const matchType = String(match.matchType || match.type || '').toUpperCase();
      const matchDateStr = String(match.dateTimeGMT || match.date || '').trim();
      const series = match.series ? String(match.series).trim() : undefined;

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

        const sanitizedMatch: SanitizedFixture = {
          matchName,
          opponent,
          matchType: 'ODI',
          date: matchDate.toISOString(),
          dateTimeGMT: matchDateStr,
          venue: String(match.venue || 'International Stadium').trim(),
          ...(series ? { series } : {}),
        };

        return {
          status: 'available',
          match: sanitizedMatch,
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

  /**
   * Retrieves next fixture with caching, rate limiting, and timeout.
   */
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

    // 1. Check Rate Limit
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

    // 2. Check In-Memory Cache
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

    // 3. Verify Server Credentials
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

    // 4. Fetch Upstream Provider with Strict Bounded Timeout
    const providerUrl = `https://api.cricapi.com/v1/cricScore?apikey=${encodeURIComponent(this.apiKey)}`;

    try {
      // Setup timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

      const response = await this.fetchFn(providerUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
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

      const rawJson = await response.json();
      const parsed = this.parseProviderPayload(rawJson, now);

      const responseBody: FixturesApiResponse = {
        ...parsed,
        meta: {
          cached: false,
          provider: 'cricketdata',
        },
      };

      // Cache valid results (available or confirmed-empty)
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

// Global shared singleton for the process
export const defaultFixturesService = new FixturesService();

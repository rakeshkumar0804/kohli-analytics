import type { IncomingMessage, ServerResponse } from 'node:http';
import { defaultFixturesService } from '../src/server/fixturesService.ts';

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

  // Extract client IP from proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || '127.0.0.1';

  const bypassCache = req.headers['cache-control'] === 'no-cache';

  const result = await defaultFixturesService.getNextFixture({
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
}

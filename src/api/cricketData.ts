import type { LiveAPIStats } from '../types';
import { careerStats } from '../data/kohliData';

// ============================================================
// CricketData.org API Integration
// Virat Kohli Player ID: 253802
// Free tier: 100 calls/day
// ============================================================

const API_KEY = import.meta.env.VITE_CRICKET_API_KEY || 'bc512d1a-7972-40db-b609-caf7132476a5';
const BASE_URL = 'https://api.cricapi.com';
const KOHLI_PLAYER_ID = '253802';

// Static fallback — used when API is unavailable
const staticFallback: LiveAPIStats = {
  matches: careerStats.overall.matches,
  runs: careerStats.overall.runs,
  centuries: careerStats.overall.centuries,
  average: careerStats.odi.average,
  strikeRate: careerStats.odi.strikeRate,
  highScore: careerStats.odi.highScore,
};

/**
 * Fetches Kohli's player statistics from CricketData.org
 * Falls back to static data if API call fails
 */
export async function fetchKohliStats(): Promise<LiveAPIStats> {
  try {
    const url = `${BASE_URL}/v1/players_info?id=${KOHLI_PLAYER_ID}&apikey=${API_KEY}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      console.warn(`CricketData API responded with ${response.status} — using static fallback`);
      return staticFallback;
    }

    const data = await response.json();

    if (data.status !== 'success' || !data.data) {
      console.warn('CricketData API returned non-success status — using static fallback');
      return staticFallback;
    }

    // Parse API response into our LiveAPIStats shape
    const playerData = data.data;
    const stats: LiveAPIStats = {
      matches: parseInt(playerData.mat ?? careerStats.overall.matches, 10),
      runs: parseInt(playerData.runs ?? careerStats.overall.runs, 10),
      centuries: parseInt(playerData['100s'] ?? careerStats.overall.centuries, 10),
      average: parseFloat(playerData.avg ?? careerStats.odi.average),
      strikeRate: parseFloat(playerData.sr ?? careerStats.odi.strikeRate),
      highScore: parseInt(String(playerData.hs ?? careerStats.odi.highScore).replace('*', ''), 10),
    };

    return stats;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn('CricketData API timed out — using static fallback');
    } else {
      console.warn('CricketData API error — using static fallback:', error);
    }
    return staticFallback;
  }
}

/**
 * Fetches India's next scheduled ODI match from CricketData.org API.
 * Returns null if no upcoming match is found or API is unavailable.
 */
export async function fetchNextMatch(): Promise<import('../types').NextMatchInfo | null> {
  try {
    const url = `${BASE_URL}/v1/cricScore?apikey=${API_KEY}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`CricketData NextMatch API responded with ${response.status}`);
      return null;
    }

    const json = await response.json();
    const matchesList = json.data || json.dataList || [];

    const now = new Date();

    // Filter matches involving India, of type ODI/Match, scheduled in the future
    for (const match of matchesList) {
      const matchName = match.name || match.title || '';
      const matchType = (match.matchType || match.type || '').toUpperCase();
      const matchDateStr = match.dateTimeGMT || match.date || '';

      if (!matchDateStr) continue;
      const matchDate = new Date(matchDateStr);

      if (isNaN(matchDate.getTime()) || matchDate <= now) continue;

      const isIndiaMatch = matchName.toLowerCase().includes('india');
      const isODI = matchType.includes('ODI') || matchName.toLowerCase().includes('odi');

      if (isIndiaMatch && isODI) {
        // Extract opponent
        const teams = matchName.split(/vs|v/i);
        let opponent = 'Opponent';
        if (teams.length >= 2) {
          opponent = teams[0].toLowerCase().includes('india') ? teams[1].trim() : teams[0].trim();
        }

        return {
          matchName,
          opponent,
          matchType: 'ODI',
          date: matchDate.toISOString(),
          dateTimeGMT: matchDateStr,
          venue: match.venue || 'International Stadium',
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('Error fetching next match from CricketData API:', err);
    return null;
  }
}

import type { PlayerIdentityResolution } from './types.ts';

export const KOHLI_CANONICAL_NAME = 'Virat Kohli';

/**
 * Stable Cricsheet Person Identifier for Virat Kohli (from Cricsheet register mapping).
 */
export const KOHLI_CRICSHEET_ID = 'ba607b88';

/**
 * External reference identifiers.
 */
export const KOHLI_EXTERNAL_IDS = {
  espncricinfo: '253802',
};

export const KNOWN_KOHLI_ALIASES = new Set([
  'V Kohli',
  'Virat Kohli',
  'VK Kohli',
]);

/**
 * Resolves whether a player reference in a Cricsheet scorecard corresponds to Virat Kohli.
 *
 * Resolution Priority:
 * 1. Source registry identifier: Checks if `registryPeople[rawName]` strictly equals Cricsheet ID 'ba607b88'.
 *    (ESPN Cricinfo ID '253802' is NEVER accepted as a Cricsheet registry ID).
 * 2. Explicit alias mapping: ('V Kohli', 'Virat Kohli', 'VK Kohli') as a documented fallback with warning.
 * 3. Exact normalized name string: ('viratkohli', 'vkohli') as fallback with warning.
 * 4. Otherwise marked unresolved / not target player.
 */
export function resolvePlayerIdentity(
  rawName: string,
  registryPeople?: Record<string, string>
): PlayerIdentityResolution & { warning?: string } {
  if (!rawName) {
    return {
      isTargetPlayer: false,
      playerName: '',
      canonicalName: KOHLI_CANONICAL_NAME,
      resolutionMethod: 'unresolved',
      evidence: 'Empty player name supplied',
    };
  }

  // 1. Primary: Match against Cricsheet registry ID
  if (registryPeople && registryPeople[rawName]) {
    const regId = String(registryPeople[rawName]).trim().toLowerCase();
    
    // Explicit negative check: ensure ESPN ID 253802 is not mistaken for a Cricsheet ID
    if (regId === KOHLI_EXTERNAL_IDS.espncricinfo) {
      return {
        isTargetPlayer: false,
        playerName: rawName,
        canonicalName: KOHLI_CANONICAL_NAME,
        registryId: regId,
        resolutionMethod: 'unresolved',
        evidence: `REJECTED: ESPN ID ${KOHLI_EXTERNAL_IDS.espncricinfo} supplied in registry field; must use Cricsheet person ID ${KOHLI_CRICSHEET_ID}`,
      };
    }

    if (regId === KOHLI_CRICSHEET_ID) {
      return {
        isTargetPlayer: true,
        playerName: rawName,
        canonicalName: KOHLI_CANONICAL_NAME,
        registryId: regId,
        resolutionMethod: 'registry-id',
        evidence: `Scorecard registry.people['${rawName}'] matches Cricsheet person ID ${KOHLI_CRICSHEET_ID}`,
      };
    }
  }

  // 2. Documented Fallback: Explicit alias mapping
  if (KNOWN_KOHLI_ALIASES.has(rawName)) {
    return {
      isTargetPlayer: true,
      playerName: rawName,
      canonicalName: KOHLI_CANONICAL_NAME,
      resolutionMethod: 'alias-map',
      evidence: `Fallback: Exact alias match in KNOWN_KOHLI_ALIASES for '${rawName}'`,
      warning: `Identity resolved via alias fallback ('${rawName}') without Cricsheet registry identifier`,
    };
  }

  // 3. Documented Fallback: Exact normalized alphanumeric match
  const normalized = rawName.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'viratkohli' || normalized === 'vkohli') {
    return {
      isTargetPlayer: true,
      playerName: rawName,
      canonicalName: KOHLI_CANONICAL_NAME,
      resolutionMethod: 'normalized-name',
      evidence: `Fallback: Normalized form '${normalized}' matches Kohli alias`,
      warning: `Identity resolved via normalized name fallback ('${normalized}') without Cricsheet registry identifier`,
    };
  }

  // 4. Not target player
  return {
    isTargetPlayer: false,
    playerName: rawName,
    canonicalName: KOHLI_CANONICAL_NAME,
    resolutionMethod: 'unresolved',
    evidence: `Player '${rawName}' is not Virat Kohli (Cricsheet ID ${KOHLI_CRICSHEET_ID})`,
  };
}

/**
 * Checks if a Cricsheet match involved Virat Kohli (in team playing XI, batting, bowling, or fielding).
 */
export function matchContainsPlayer(
  matchInfo: { players?: Record<string, string[]>; registry?: { people?: Record<string, string> } },
  targetCanonicalName = KOHLI_CANONICAL_NAME
): { involved: boolean; resolution?: PlayerIdentityResolution & { warning?: string } } {
  const people = matchInfo.registry?.people;

  // 1. Check registry dictionary directly
  if (people) {
    for (const [name, id] of Object.entries(people)) {
      if (String(id).trim().toLowerCase() === KOHLI_CRICSHEET_ID) {
        return {
          involved: true,
          resolution: {
            isTargetPlayer: true,
            playerName: name,
            canonicalName: targetCanonicalName,
            registryId: String(id),
            resolutionMethod: 'registry-id',
            evidence: `Found ${name} with Cricsheet ID ${KOHLI_CRICSHEET_ID} in match registry`,
          },
        };
      }
    }
  }

  // 2. Check team rosters
  if (matchInfo.players) {
    for (const team in matchInfo.players) {
      const roster = matchInfo.players[team] || [];
      for (const playerName of roster) {
        const res = resolvePlayerIdentity(playerName, people);
        if (res.isTargetPlayer) {
          return { involved: true, resolution: res };
        }
      }
    }
  }

  return { involved: false };
}

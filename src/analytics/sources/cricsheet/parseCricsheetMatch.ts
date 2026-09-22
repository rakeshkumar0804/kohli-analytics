import type {
  MatchFormat,
  MatchResult,
  DismissalKind,
  TargetMetadata,
} from '../../types.ts';
import { normalizeMatch } from '../../normalizeMatch.ts';
import type { RawMatchInput, RawInningsInput, RawDeliveryInput } from '../../normalizeMatch.ts';
import { type CricsheetMatch, type CricsheetInnings, SUPPORTED_CRICSHEET_SCHEMA_VERSIONS } from './types.ts';
import { classifyMatchStage, type StageOverrideRecord } from './matchStage.ts';
import { resolvePlayerIdentity } from './mapRegistry.ts';

export interface ParseOptions {
  stageOverridesMap?: Map<string, StageOverrideRecord>;
  strictSchema?: boolean;
}

export interface ParseResult {
  match: ReturnType<typeof normalizeMatch> | null;
  warnings: string[];
  skippedReason?: string;
}

/**
 * Maps Cricsheet match type string to normalized MatchFormat.
 */
export function mapMatchType(matchType: string, eventName?: string): MatchFormat | null {
  const normType = (matchType || '').toUpperCase().trim();
  const normEvent = (eventName || '').toUpperCase();

  if (normEvent.includes('INDIAN PREMIER LEAGUE') || normEvent.includes('IPL')) {
    return 'IPL';
  }
  if (normType === 'ODI' || normType === 'ODM') {
    return 'ODI';
  }
  if (normType === 'T20' || normType === 'IT20') {
    return 'T20I';
  }
  if (normType === 'TEST' || normType === 'MDM') {
    return 'Test';
  }
  return null;
}

/**
 * Maps Cricsheet dismissal kind to normalized DismissalKind.
 */
export function mapDismissalKind(kind: string): DismissalKind {
  const k = (kind || '').toLowerCase().trim();
  if (k === 'caught') return 'caught';
  if (k === 'bowled') return 'bowled';
  if (k === 'lbw') return 'lbw';
  if (k === 'run out') return 'run-out';
  if (k === 'stumped') return 'stumped';
  if (k === 'caught and bowled') return 'caught-and-bowled';
  if (k === 'hit wicket') return 'hit-wicket';
  if (k === 'retired hurt' || k === 'retired not out') return 'retired-hurt';
  if (k === 'retired out') return 'retired-out';
  if (k === 'obstructing the field') return 'obstructing-field';
  if (k === 'timed out') return 'timed-out';
  return 'not-out';
}

/**
 * Parses a Cricsheet JSON match into the normalized analytical match model.
 */
export function parseCricsheetMatch(
  matchId: string,
  raw: CricsheetMatch,
  options: ParseOptions = {}
): ParseResult {
  const warnings: string[] = [];

  if (!raw || !raw.info) {
    return { match: null, warnings: ['Malformed match object: missing info block'], skippedReason: 'missing-info' };
  }

  const { info, meta, innings: rawInnings } = raw;

  // 1. Schema version check
  const schemaVer = meta?.data_version || 'unknown';
  const isSupported = (SUPPORTED_CRICSHEET_SCHEMA_VERSIONS as readonly string[]).includes(schemaVer);
  if (!isSupported) {
    warnings.push(`Unsupported or unknown Cricsheet schema version '${schemaVer}' (supported: ${SUPPORTED_CRICSHEET_SCHEMA_VERSIONS.join(', ')})`);
    if (options.strictSchema) {
      return { match: null, warnings, skippedReason: 'unsupported-schema-version' };
    }
  }

  // 2. Gender filtering (scope: men's senior international and domestic)
  if (info.gender && info.gender.toLowerCase() !== 'male') {
    return { match: null, warnings: [`Filtered non-male match (gender: ${info.gender})`], skippedReason: 'non-male-scope' };
  }

  // 3. Match format mapping
  const eventName = info.event?.name;
  const format = mapMatchType(info.match_type, eventName);
  if (!format) {
    return { match: null, warnings: [`Unsupported match type '${info.match_type}'`], skippedReason: 'unsupported-format' };
  }

  // 4. Teams validation
  if (!Array.isArray(info.teams) || info.teams.length !== 2) {
    return { match: null, warnings: [`Match does not have exactly 2 teams: ${JSON.stringify(info.teams)}`], skippedReason: 'invalid-teams' };
  }
  const teams: [string, string] = [info.teams[0], info.teams[1]];

  // 5. Match date
  const date = Array.isArray(info.dates) && info.dates.length > 0 ? info.dates[0] : 'unknown-date';

  // 6. Stage classification
  const stageRes = classifyMatchStage(matchId, info, options.stageOverridesMap);

  // 7. Match Result mapping
  let resultType: MatchResult = 'won';
  const outcomeResult = (info.outcome?.result || '').toLowerCase();
  if (outcomeResult === 'tie' || outcomeResult === 'tied') {
    resultType = 'tied';
  } else if (outcomeResult === 'no result' || outcomeResult === 'abandoned') {
    resultType = 'no-result';
  } else if (outcomeResult === 'draw' || outcomeResult === 'drawn') {
    resultType = 'draw';
  } else if (!info.outcome?.winner) {
    resultType = 'no-result';
  }

  // 8. Innings parsing (exclude super overs from main innings list)
  const regularInningsList = (rawInnings || []).filter((inn) => !inn.super_over);
  if (regularInningsList.length === 0) {
    return { match: null, warnings: ['No regular innings found in scorecard'], skippedReason: 'empty-innings' };
  }

  const people = info.registry?.people;
  const inningsInputs: RawInningsInput[] = [];

  for (let idx = 0; idx < regularInningsList.length; idx++) {
    const rawInn: CricsheetInnings = regularInningsList[idx];
    const inningsNumber = idx + 1;
    const battingTeam = rawInn.team;
    const bowlingTeam = teams[0] === battingTeam ? teams[1] : teams[0];

    const defaultOversLimit = format === 'ODI' ? 50 : format === 'T20I' || format === 'IPL' ? 20 : undefined;
    const oversLimit = rawInn.target?.overs ?? defaultOversLimit;

    const deliveryInputs: RawDeliveryInput[] = [];

    for (const overObj of rawInn.overs || []) {
      const overNum = overObj.over;
      let ballInOver = 1;

      for (const del of overObj.deliveries || []) {
        // Resolve batter identity to canonical name if it is Virat Kohli
        const batterRes = resolvePlayerIdentity(del.batter, people);
        const batterName = batterRes.isTargetPlayer ? batterRes.canonicalName : del.batter;

        const nonStrikerRes = resolvePlayerIdentity(del.non_striker, people);
        const nonStrikerName = nonStrikerRes.isTargetPlayer ? nonStrikerRes.canonicalName : del.non_striker;

        const bowlerRes = resolvePlayerIdentity(del.bowler, people);
        const bowlerName = bowlerRes.isTargetPlayer ? bowlerRes.canonicalName : del.bowler;

        // Extras mapping
        const extras = del.extras ? {
          wides: del.extras.wides || 0,
          noBalls: del.extras.noballs || 0,
          byes: del.extras.byes || 0,
          legByes: del.extras.legbyes || 0,
          penalty: del.extras.penalty || 0,
        } : undefined;

        // Wicket mapping
        let wicket: RawDeliveryInput['wicket'] | undefined;
        if (Array.isArray(del.wickets) && del.wickets.length > 0) {
          const w = del.wickets[0];
          const outRes = resolvePlayerIdentity(w.player_out, people);
          const playerDismissed = outRes.isTargetPlayer ? outRes.canonicalName : w.player_out;

          let fielderName: string | undefined;
          if (Array.isArray(w.fielders) && w.fielders.length > 0) {
            const f = w.fielders[0];
            fielderName = typeof f === 'string' ? f : f?.name;
          }

          wicket = {
            playerDismissed,
            kind: mapDismissalKind(w.kind),
            fielder: fielderName,
          };
        }

        deliveryInputs.push({
          over: overNum,
          ball: ballInOver,
          batter: batterName,
          nonStriker: nonStrikerName,
          bowler: bowlerName,
          batterRuns: del.runs?.batter || 0,
          nonBoundary: Boolean(del.runs?.non_boundary || del.non_boundary),
          extras,
          wicket,
        });

        ballInOver += 1;
      }
    }

    const isRevisedTarget = Boolean(info.outcome?.method === 'D/L' || info.outcome?.method === 'DLS');
    const isDeclared = Boolean(rawInn.declared);
    const isAbandoned = Boolean(outcomeResult === 'no result' || outcomeResult === 'abandoned');

    let target = rawInn.target?.runs;
    let targetMetadata: TargetMetadata | undefined;

    // Target Resolution Hierarchy for limited-overs chase innings
    if (inningsNumber === 2 && (format === 'ODI' || format === 'T20I' || format === 'IPL')) {
      if (rawInn.target?.runs !== undefined && (isRevisedTarget || (rawInn.target?.overs !== undefined && rawInn.target.overs !== defaultOversLimit))) {
        // Level A: Explicit revised target
        target = rawInn.target.runs;
        targetMetadata = {
          targetRuns: rawInn.target.runs,
          targetSource: 'explicit-revised',
          targetConfidence: 'authoritative',
          effectiveOvers: rawInn.target.overs ?? oversLimit,
          targetEvidence: `Authoritative revised/DLS target from match outcome/innings metadata: ${rawInn.target.runs} runs in ${rawInn.target.overs ?? oversLimit} overs`,
        };
      } else if (rawInn.target?.runs !== undefined) {
        // Level B: Explicit standard target
        target = rawInn.target.runs;
        targetMetadata = {
          targetRuns: rawInn.target.runs,
          targetSource: 'explicit-standard',
          targetConfidence: 'authoritative',
          effectiveOvers: rawInn.target.overs ?? defaultOversLimit,
          targetEvidence: `Explicit standard Cricsheet target object: ${rawInn.target.runs} runs`,
        };
      } else if (!isRevisedTarget && !rawInn.super_over && inningsInputs.length > 0) {
        // Level C: Derived ordinary target (first innings total + 1)
        const firstInnDeliveries = inningsInputs[0]?.deliveries || [];
        if (firstInnDeliveries.length > 0) {
          const firstInnRuns = firstInnDeliveries.reduce(
            (sum, d) => sum + d.batterRuns + (d.extras?.wides || 0) + (d.extras?.noBalls || 0) + (d.extras?.byes || 0) + (d.extras?.legByes || 0) + (d.extras?.penalty || 0),
            0
          );
          const derivedTarget = firstInnRuns + 1;
          target = derivedTarget;
          targetMetadata = {
            targetRuns: derivedTarget,
            targetSource: 'derived-first-innings-plus-one',
            targetConfidence: 'high',
            effectiveOvers: defaultOversLimit,
            targetEvidence: `Derived from complete first innings total: ${firstInnRuns} + 1 = ${derivedTarget} in ${defaultOversLimit} scheduled overs`,
          };
        }
      }
    } else if (rawInn.target?.runs !== undefined) {
      target = rawInn.target.runs;
      targetMetadata = {
        targetRuns: rawInn.target.runs,
        targetSource: isRevisedTarget ? 'explicit-revised' : 'explicit-standard',
        targetConfidence: 'authoritative',
        effectiveOvers: rawInn.target.overs ?? oversLimit,
        targetEvidence: `Target specified in Cricsheet metadata: ${rawInn.target.runs} runs`,
      };
    }

    inningsInputs.push({
      inningsNumber,
      battingTeam,
      bowlingTeam,
      target,
      targetMetadata,
      oversLimit,
      isRevisedTarget,
      isDeclared,
      isAbandoned,
      deliveries: deliveryInputs,
    });
  }

  // 9. Construct normalized match input
  const rawMatchInput: RawMatchInput = {
    matchId,
    date,
    format,
    competition: eventName || `${teams[0]} vs ${teams[1]} ${format} Series`,
    stage: stageRes.stage,
    isKnockout: stageRes.isKnockout,
    isFinal: stageRes.isFinal,
    venue: info.venue || 'Unknown Venue',
    city: info.city,
    country: undefined,
    teams,
    tossWinner: info.toss?.winner || teams[0],
    tossDecision: info.toss?.decision === 'field' ? 'field' : 'bat',
    winner: info.outcome?.winner,
    resultType,
    target: inningsInputs[1]?.target,
    targetMetadata: inningsInputs[1]?.targetMetadata,
    source: 'cricsheet',
    sourceVersion: schemaVer,
    innings: inningsInputs,
  };

  try {
    const normalized = normalizeMatch(rawMatchInput);
    return { match: normalized, warnings };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Normalization failed: ${msg}`);
    return { match: null, warnings, skippedReason: 'normalization-error' };
  }
}

import type { TournamentStage } from '../../types.ts';
import type { CricsheetInfo } from './types.ts';

export interface StageOverrideRecord {
  matchId: string;
  assignedStage: TournamentStage;
  competition?: string;
  reason: string;
  evidenceUrl?: string;
  verifiedOn: string;
}

export interface StageOverridesFile {
  version: string;
  overrides: StageOverrideRecord[];
}

export interface StageClassificationResult {
  stage: TournamentStage;
  isKnockout: boolean;
  isFinal: boolean;
  classificationMethod: 'override' | 'structured-event' | 'tournament-rule' | 'bilateral-default' | 'fallback';
  reason: string;
}

/**
 * Classifies the stage of a match using deterministic priority rules.
 */
export function classifyMatchStage(
  matchId: string,
  info: CricsheetInfo,
  overridesMap?: Map<string, StageOverrideRecord>
): StageClassificationResult {
  // 1. Check explicit match ID override
  if (overridesMap && overridesMap.has(matchId)) {
    const override = overridesMap.get(matchId)!;
    const isFinal = override.assignedStage === 'final';
    const isKnockout = isFinal || override.assignedStage === 'semi-final' || override.assignedStage === 'eliminator' || override.assignedStage === 'qualifier';
    return {
      stage: override.assignedStage,
      isKnockout,
      isFinal,
      classificationMethod: 'override',
      reason: override.reason,
    };
  }

  const event = info.event;
  const eventName = (event?.name || '').toLowerCase();
  const eventStage = (event?.stage || '').toLowerCase();
  const matchNumStr = String(event?.match_number || '').toLowerCase();

  // 2. Structured event stage metadata
  if (eventStage) {
    if (eventStage.includes('final') && !eventStage.includes('semi') && !eventStage.includes('quarter')) {
      return {
        stage: 'final',
        isKnockout: true,
        isFinal: true,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
    if (eventStage.includes('semi')) {
      return {
        stage: 'semi-final',
        isKnockout: true,
        isFinal: false,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
    if (eventStage.includes('quarter')) {
      return {
        stage: 'super-8', // or super-stage knockout
        isKnockout: true,
        isFinal: false,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
    if (eventStage.includes('qualifier') || eventStage.includes('eliminator')) {
      const stage: TournamentStage = eventStage.includes('qualifier') ? 'qualifier' : 'eliminator';
      return {
        stage,
        isKnockout: true,
        isFinal: false,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
    if (eventStage.includes('super 8') || eventStage.includes('super 12') || eventStage.includes('super 6') || eventStage.includes('super four') || eventStage.includes('super 4')) {
      return {
        stage: 'super-8',
        isKnockout: false,
        isFinal: false,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
    if (eventStage.includes('group') || eventStage.includes('pool') || eventStage.includes('round') || eventStage.includes('league')) {
      return {
        stage: 'group',
        isKnockout: false,
        isFinal: false,
        classificationMethod: 'structured-event',
        reason: `Structured event.stage is '${event?.stage || ''}'`,
      };
    }
  }

  // 3. Match number / string cues in tournament context
  if (matchNumStr.includes('final') && !matchNumStr.includes('semi') && !matchNumStr.includes('quarter')) {
    return {
      stage: 'final',
      isKnockout: true,
      isFinal: true,
      classificationMethod: 'tournament-rule',
      reason: `event.match_number specifies '${event?.match_number}'`,
    };
  }
  if (matchNumStr.includes('semi')) {
    return {
      stage: 'semi-final',
      isKnockout: true,
      isFinal: false,
      classificationMethod: 'tournament-rule',
      reason: `event.match_number specifies '${event?.match_number}'`,
    };
  }

  // 4. Bilateral vs Tournament classification
  if (!eventName || eventName.includes('tour') || eventName.includes('series') || eventName.includes('in india') || eventName.includes('in australia') || eventName.includes('in england')) {
    // Check if it's a triangular/multilateral tournament series vs bilateral
    if (!eventName.includes('tri-series') && !eventName.includes('triangular') && !eventName.includes('trophy') && !eventName.includes('cup')) {
      return {
        stage: 'bilateral',
        isKnockout: false,
        isFinal: false,
        classificationMethod: 'bilateral-default',
        reason: eventName ? `Bilateral tour series '${event?.name}'` : 'Standard bilateral fixture (no tournament event)',
      };
    }
  }

  // 5. If event exists but stage is unspecified, default to group/league
  if (eventName) {
    return {
      stage: 'group',
      isKnockout: false,
      isFinal: false,
      classificationMethod: 'tournament-rule',
      reason: `Tournament event '${event?.name}' without specific knockout stage`,
    };
  }

  return {
    stage: 'bilateral',
    isKnockout: false,
    isFinal: false,
    classificationMethod: 'fallback',
    reason: 'Unspecified event context treated as bilateral',
  };
}

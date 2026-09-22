// ============================================================
// Cricsheet Raw Data Model & Source Schema Types
// ============================================================

export const SUPPORTED_CRICSHEET_SCHEMA_VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '1.3.0'] as const;
export type SupportedSchemaVersion = typeof SUPPORTED_CRICSHEET_SCHEMA_VERSIONS[number];

export interface CricsheetMeta {
  data_version: string;
  created: string;
  revision: number;
}

export interface CricsheetEvent {
  name?: string;
  match_number?: number | string;
  stage?: string;
  group?: string;
  sub_stage?: string;
}

export interface CricsheetOutcomeBy {
  runs?: number;
  wickets?: number;
  innings?: number;
}

export interface CricsheetOutcome {
  winner?: string;
  by?: CricsheetOutcomeBy;
  result?: 'draw' | 'tie' | 'no result' | string;
  method?: 'D/L' | 'DLS' | string;
  eliminator?: string;
  bowl_out?: string;
}

export interface CricsheetToss {
  decision: 'bat' | 'field';
  winner: string;
}

export interface CricsheetInfo {
  balls_per_over?: number;
  city?: string;
  dates: string[];
  event?: CricsheetEvent;
  gender: 'male' | 'female' | string;
  match_type: 'ODI' | 'T20' | 'IT20' | 'Test' | 'MDM' | 'ODM' | string;
  match_type_number?: number;
  officials?: Record<string, string[]>;
  outcome: CricsheetOutcome;
  overs?: number;
  player_of_match?: string[];
  players: Record<string, string[]>;
  registry?: {
    people?: Record<string, string>;
  };
  season?: string | number;
  team_type?: 'international' | 'club' | string;
  teams: [string, string] | string[];
  toss: CricsheetToss;
  venue: string;
}

export interface CricsheetExtras {
  wides?: number;
  noballs?: number;
  byes?: number;
  legbyes?: number;
  penalty?: number;
}

export interface CricsheetWicket {
  player_out: string;
  kind:
    | 'bowled'
    | 'caught'
    | 'caught and bowled'
    | 'lbw'
    | 'run out'
    | 'stumped'
    | 'hit wicket'
    | 'retired hurt'
    | 'retired not out'
    | 'retired out'
    | 'obstructing the field'
    | 'hit the ball twice'
    | 'timed out'
    | 'handled the ball'
    | string;
  fielders?: Array<{ name: string } | string>;
}

export interface CricsheetReview {
  batter: string;
  by: string;
  decision: string;
  type: string;
  umpire: string;
  umpires_call: boolean;
}

export interface CricsheetDelivery {
  batter: string;
  bowler: string;
  non_striker: string;
  actual_delivery?: number; // Schema 1.2.0: optional actual sequence index
  runs: {
    batter: number;
    extras: number;
    total: number;
    non_boundary?: number | boolean;
  };
  non_boundary?: number | boolean;
  extras?: CricsheetExtras;
  wickets?: CricsheetWicket[];
  review?: CricsheetReview;
  replacements?: {
    match?: Array<{ in: string; out: string; reason?: string; team?: string }>;
    role?: Array<{ in: string; out: string; reason?: string; role?: string }>;
  };
}

export interface CricsheetOver {
  over: number; // 0-indexed over number (0..49 in modern Cricsheet format)
  deliveries: CricsheetDelivery[];
}

export interface CricsheetInningsTarget {
  overs?: number;
  runs: number;
}

export interface CricsheetInnings {
  team: string;
  overs: CricsheetOver[];
  target?: CricsheetInningsTarget;
  super_over?: boolean;
  penalty_runs?: {
    pre?: number;
    post?: number;
  };
  declared?: boolean;
  forfeited?: boolean;
  absent_hurt?: string[];
}

export interface CricsheetMatch {
  meta: CricsheetMeta;
  info: CricsheetInfo;
  innings: CricsheetInnings[];
}

export interface PlayerIdentityResolution {
  isTargetPlayer: boolean;
  playerName: string;
  canonicalName: string;
  cricsheetPersonId?: string;
  externalIds?: {
    espncricinfo?: string;
  };
  registryId?: string;
  resolutionMethod: 'registry-id' | 'alias-map' | 'normalized-name' | 'unresolved';
  evidence: string;
}

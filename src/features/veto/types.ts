export const TEAM = {
  A: "A",
  B: "B",
} as const;

export type Team = (typeof TEAM)[keyof typeof TEAM];

export const SIDE = {
  ATTACK: "attack",
  DEFENSE: "defense",
} as const;

export type Side = (typeof SIDE)[keyof typeof SIDE];

export const VETO_FORMAT = {
  BO1: "bo1",
  BO3: "bo3",
  BO5: "bo5",
} as const;

export type VetoFormat = (typeof VETO_FORMAT)[keyof typeof VETO_FORMAT];

/** Minimum pool size each format needs to reach a decider without running out of maps. */
export const MIN_POOL_SIZE: Record<VetoFormat, number> = {
  [VETO_FORMAT.BO1]: 2,
  [VETO_FORMAT.BO3]: 5,
  [VETO_FORMAT.BO5]: 7,
};

export interface VetoConfig {
  format: VetoFormat;
  teamA: string;
  teamB: string;
  /** Map ids, in the order they'll be offered — duplicates are rejected. */
  pool: string[];
}

export const VETO_ERROR = {
  POOL_TOO_SMALL: "pool_too_small",
  DUPLICATE_MAP: "duplicate_map",
  MISSING_TEAM_NAME: "missing_team_name",
  DUPLICATE_TEAM_NAME: "duplicate_team_name",
} as const;

export type VetoErrorCode = (typeof VETO_ERROR)[keyof typeof VETO_ERROR];

export interface VetoError {
  error: VetoErrorCode;
  message: string;
}

export const MAP_VETO_STATUS = {
  AVAILABLE: "available",
  BANNED: "banned",
  PICKED: "picked",
} as const;

export type MapVetoStatus = (typeof MAP_VETO_STATUS)[keyof typeof MAP_VETO_STATUS];

export type PickedBy = Team | "decider";

export interface MapVetoState {
  status: MapVetoStatus;
  bannedBy?: Team;
  pickedBy?: PickedBy;
  side?: { team: Team; side: Side };
}

export interface BanLogEntry {
  type: "ban";
  mapId: string;
  by: Team;
}

export interface PickLogEntry {
  type: "pick";
  mapId: string;
  by: PickedBy;
}

export interface SideLogEntry {
  type: "side";
  mapId: string;
  team: Team;
  side: Side;
}

export type VetoLogEntry = BanLogEntry | PickLogEntry | SideLogEntry;

interface VetoHistorySnapshot {
  maps: Record<string, MapVetoState>;
  log: VetoLogEntry[];
}

export interface VetoState {
  config: VetoConfig;
  maps: Record<string, MapVetoState>;
  log: VetoLogEntry[];
  history: VetoHistorySnapshot[];
}

export const VETO_STEP_KIND = {
  BAN: "ban",
  PICK: "pick",
  SIDE: "side",
} as const;

export type VetoStepKind = (typeof VETO_STEP_KIND)[keyof typeof VETO_STEP_KIND];

export interface VetoStep {
  kind: VetoStepKind;
  team: Team;
  /** Only set for "side" steps — the map the side choice applies to. */
  mapId?: string;
}

export type VetoAction =
  | { type: "ban"; mapId: string; team: Team }
  | { type: "pick"; mapId: string; team: Team }
  | { type: "side"; mapId: string; team: Team; side: Side };

export interface VetoSummaryPlayedMap {
  mapId: string;
  pickedBy: PickedBy;
  side?: { team: Team; side: Side };
}

export interface VetoSummaryBannedMap {
  mapId: string;
  by: Team;
}

export interface VetoSummary {
  format: VetoFormat;
  teamA: string;
  teamB: string;
  playedMaps: VetoSummaryPlayedMap[];
  bannedMaps: VetoSummaryBannedMap[];
}

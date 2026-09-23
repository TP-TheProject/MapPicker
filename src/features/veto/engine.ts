import {
  MAP_VETO_STATUS,
  MIN_POOL_SIZE,
  TEAM,
  VETO_ERROR,
  VETO_FORMAT,
  VETO_STEP_KIND,
  type MapVetoState,
  type Team,
  type VetoAction,
  type VetoConfig,
  type VetoError,
  type VetoFormat,
  type VetoLogEntry,
  type VetoState,
  type VetoStep,
  type VetoSummary,
} from "@/features/veto/types";

/** Fixed ban/pick pattern each format runs before falling back to alternating bans. */
const FORMAT_PREFIX: Record<VetoFormat, Array<"ban" | "pick">> = {
  [VETO_FORMAT.BO1]: [],
  [VETO_FORMAT.BO3]: ["ban", "ban", "pick", "pick"],
  [VETO_FORMAT.BO5]: ["ban", "ban", "pick", "pick", "pick", "pick"],
};

function opposite(team: Team): Team {
  return team === TEAM.A ? TEAM.B : TEAM.A;
}

/**
 * The full explicit (non-decider) action plan for a pool of `poolSize` maps: the format's
 * fixed prefix, then alternating bans, always alternating team turns A,B,A,B,... The final
 * map is never in this plan — it's auto-assigned as the decider once one map remains.
 */
function buildActionPlan(
  format: VetoFormat,
  poolSize: number,
): Array<{ kind: "ban" | "pick"; team: Team }> {
  const prefix = FORMAT_PREFIX[format];
  const totalActions = poolSize - 1;
  const plan: Array<{ kind: "ban" | "pick"; team: Team }> = [];

  for (let i = 0; i < totalActions; i++) {
    const team = i % 2 === 0 ? TEAM.A : TEAM.B;
    const kind = i < prefix.length ? prefix[i] : "ban";
    // prefix is fully consumed before totalActions runs out for any valid (validated) pool size.
    plan.push({ kind: kind ?? "ban", team });
  }

  return plan;
}

export function createVeto(config: VetoConfig): VetoState | VetoError {
  if (config.teamA.trim() === "" || config.teamB.trim() === "") {
    return { error: VETO_ERROR.MISSING_TEAM_NAME, message: "Both team names are required." };
  }

  if (config.teamA.trim().toLowerCase() === config.teamB.trim().toLowerCase()) {
    return { error: VETO_ERROR.DUPLICATE_TEAM_NAME, message: "Team names must be different." };
  }

  const uniquePool = new Set(config.pool);
  if (uniquePool.size !== config.pool.length) {
    return { error: VETO_ERROR.DUPLICATE_MAP, message: "The pool contains duplicate maps." };
  }

  const minSize = MIN_POOL_SIZE[config.format];
  if (config.pool.length < minSize) {
    return {
      error: VETO_ERROR.POOL_TOO_SMALL,
      message: `${config.format.toUpperCase()} needs at least ${minSize} maps in the pool.`,
    };
  }

  const maps: Record<string, MapVetoState> = Object.fromEntries(
    config.pool.map((mapId) => [mapId, { status: MAP_VETO_STATUS.AVAILABLE }]),
  );

  return { config, maps, log: [], history: [] };
}

function availableMapIds(state: VetoState): string[] {
  return state.config.pool.filter(
    (mapId) => state.maps[mapId]?.status === MAP_VETO_STATUS.AVAILABLE,
  );
}

function lastBanTeam(log: VetoLogEntry[]): Team | undefined {
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    if (entry?.type === "ban") return entry.by;
  }
  return undefined;
}

/** Finds a picked map still waiting on its side-selection step, if any. */
function pendingSideStep(state: VetoState): VetoStep | undefined {
  for (const entry of state.log) {
    if (entry.type !== "pick") continue;
    const map = state.maps[entry.mapId];
    if (map?.status === MAP_VETO_STATUS.PICKED && map.side === undefined) {
      const team =
        entry.by === "decider" ? opposite(lastBanTeam(state.log) ?? TEAM.A) : opposite(entry.by);
      return { kind: VETO_STEP_KIND.SIDE, team, mapId: entry.mapId };
    }
  }
  return undefined;
}

/** Returns the next step a team must take, or `undefined` once the veto is complete. */
export function currentStep(state: VetoState): VetoStep | undefined {
  const pendingSide = pendingSideStep(state);
  if (pendingSide) return pendingSide;

  const plan = buildActionPlan(state.config.format, state.config.pool.length);
  const explicitActionsCount = state.log.filter(
    (entry) => entry.type === "ban" || (entry.type === "pick" && entry.by !== "decider"),
  ).length;

  if (explicitActionsCount < plan.length) {
    const step = plan[explicitActionsCount];
    if (step === undefined) return undefined;
    return { kind: step.kind, team: step.team };
  }

  return undefined;
}

export function isComplete(state: VetoState): boolean {
  return currentStep(state) === undefined;
}

export interface VetoPlanStep {
  kind: "ban" | "pick" | "decider";
  team?: Team;
  /** True once this step has been resolved (present in `state.log`, or the decider auto-assigned). */
  done: boolean;
  /** True for the single step the acting team must resolve next. */
  current: boolean;
}

/**
 * Full ordered step list for `state.config` (fixed format prefix, then alternating bans, then
 * the auto-assigned decider) with each step's done/current status — powers the veto step
 * timeline UI. Read-only derived view; never mutates or drives `applyAction`.
 */
export function describeSteps(state: VetoState): VetoPlanStep[] {
  const plan = buildActionPlan(state.config.format, state.config.pool.length);
  const explicitActionsCount = state.log.filter(
    (entry) => entry.type === "ban" || (entry.type === "pick" && entry.by !== "decider"),
  ).length;

  const steps: VetoPlanStep[] = plan.map((step, index) => ({
    kind: step.kind,
    team: step.team,
    done: index < explicitActionsCount,
    current: index === explicitActionsCount,
  }));

  const deciderResolved = state.log.some(
    (entry) => entry.type === "pick" && entry.by === "decider",
  );
  steps.push({
    kind: "decider",
    done: deciderResolved,
    current: explicitActionsCount >= plan.length && !deciderResolved,
  });

  return steps;
}

function snapshot(state: VetoState) {
  return { maps: state.maps, log: state.log };
}

/**
 * Applies a ban, pick, or side-selection action. Rejects (returns the same state, unchanged)
 * when the action doesn't match the current required step, targets a map in the wrong
 * status, or comes from the wrong team.
 */
export function applyAction(state: VetoState, action: VetoAction): VetoState {
  const step = currentStep(state);
  if (step === undefined) return state;
  if (step.kind !== action.type || step.team !== action.team) return state;
  if (step.mapId !== undefined && step.mapId !== action.mapId) return state;

  const map = state.maps[action.mapId];
  if (map === undefined) return state;

  const historyEntry = snapshot(state);

  if (action.type === "ban") {
    if (map.status !== MAP_VETO_STATUS.AVAILABLE) return state;
    const maps = {
      ...state.maps,
      [action.mapId]: {
        status: MAP_VETO_STATUS.BANNED,
        bannedBy: action.team,
      } satisfies MapVetoState,
    };
    const log: VetoLogEntry[] = [
      ...state.log,
      { type: "ban", mapId: action.mapId, by: action.team },
    ];
    return finalizeAfterAction({ ...state, maps, log, history: [...state.history, historyEntry] });
  }

  if (action.type === "pick") {
    if (map.status !== MAP_VETO_STATUS.AVAILABLE) return state;
    const maps = {
      ...state.maps,
      [action.mapId]: {
        status: MAP_VETO_STATUS.PICKED,
        pickedBy: action.team,
      } satisfies MapVetoState,
    };
    const log: VetoLogEntry[] = [
      ...state.log,
      { type: "pick", mapId: action.mapId, by: action.team },
    ];
    return finalizeAfterAction({ ...state, maps, log, history: [...state.history, historyEntry] });
  }

  // action.type === "side"
  if (map.status !== MAP_VETO_STATUS.PICKED || map.side !== undefined) return state;
  const maps = {
    ...state.maps,
    [action.mapId]: {
      ...map,
      side: { team: action.team, side: action.side },
    } satisfies MapVetoState,
  };
  const log: VetoLogEntry[] = [
    ...state.log,
    { type: "side", mapId: action.mapId, team: action.team, side: action.side },
  ];
  return { ...state, maps, log, history: [...state.history, historyEntry] };
}

/** After a ban/pick, auto-assigns the sole remaining map as the decider. */
function finalizeAfterAction(state: VetoState): VetoState {
  const available = availableMapIds(state);
  if (available.length !== 1) return state;

  const decider = available[0];
  if (decider === undefined) return state;

  const maps = {
    ...state.maps,
    [decider]: { status: MAP_VETO_STATUS.PICKED, pickedBy: "decider" } satisfies MapVetoState,
  };
  const log: VetoLogEntry[] = [...state.log, { type: "pick", mapId: decider, by: "decider" }];
  return { ...state, maps, log };
}

export function undo(state: VetoState): VetoState {
  if (state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];
  if (previous === undefined) return state;
  return { ...state, maps: previous.maps, log: previous.log, history: state.history.slice(0, -1) };
}

export function summarize(state: VetoState): VetoSummary {
  const playedMaps = state.log
    .filter((entry): entry is Extract<VetoLogEntry, { type: "pick" }> => entry.type === "pick")
    .map((entry) => ({
      mapId: entry.mapId,
      pickedBy: entry.by,
      side: state.maps[entry.mapId]?.side,
    }));

  const bannedMaps = state.log
    .filter((entry): entry is Extract<VetoLogEntry, { type: "ban" }> => entry.type === "ban")
    .map((entry) => ({ mapId: entry.mapId, by: entry.by }));

  return {
    format: state.config.format,
    teamA: state.config.teamA,
    teamB: state.config.teamB,
    playedMaps,
    bannedMaps,
  };
}

export function isVetoError(result: VetoState | VetoError): result is VetoError {
  return "error" in result;
}

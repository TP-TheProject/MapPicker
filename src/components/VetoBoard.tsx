import { toast } from "sonner";

import { SideChoice } from "@/components/SideChoice";
import { TurnBanner } from "@/components/TurnBanner";
import { VetoMapCard } from "@/components/VetoMapCard";
import { VetoSetupForm, type VetoSetupValues } from "@/components/VetoSetupForm";
import { VetoSummary } from "@/components/VetoSummary";
import { VetoTimeline } from "@/components/VetoTimeline";
import type { GameMap } from "@/features/maps";
import {
  describeSteps,
  formatSummary,
  MAP_VETO_STATUS,
  TEAM,
  VETO_STEP_KIND,
  type Side,
  type Team,
  type UseVetoResult,
} from "@/features/veto";
import { useI18n } from "@/i18n";

interface VetoBoardProps {
  /** Current selectable pool — used to start a new veto and to size the setup form. */
  pool: GameMap[];
  /** Full known map catalog — used to resolve maps referenced by an already-started veto's
   * `state.config.pool`, independent of the live pool selection. */
  allMaps: GameMap[];
  /** Lifted `useVeto` binding — kept in the parent so it survives mode switches. */
  veto: UseVetoResult;
}

/** Structured (team A vs team B) veto flow: setup, turn-by-turn bans/picks/sides, then summary. */
export function VetoBoard({ pool, allMaps, veto }: VetoBoardProps) {
  const { t, lang } = useI18n();
  const { state, setupError, step, complete, summary, start, dispatch, undo, reset, canUndo } =
    veto;

  function handleStart(values: VetoSetupValues): void {
    start({ ...values, pool: pool.map((map) => map.id) });
  }

  if (state === null) {
    return (
      <div className="px-4 md:px-8">
        <VetoSetupForm
          onSubmit={handleStart}
          poolSize={pool.length}
          error={setupError ?? undefined}
        />
      </div>
    );
  }

  // Resolve the veto's own map pool against the full map catalog, not the live selection — the
  // pool is locked while a veto is active, but this keeps the board/summary correct even if
  // that invariant is ever bypassed.
  const mapById = new Map(allMaps.map((map) => [map.id, map]));
  const vetoMaps = state.config.pool
    .map((mapId) => mapById.get(mapId))
    .filter((map): map is GameMap => map !== undefined);

  const teamName = (team: Team) => (team === TEAM.A ? state.config.teamA : state.config.teamB);

  function handleMapClick(mapId: string): void {
    if (state === null || step === undefined || step.kind === VETO_STEP_KIND.SIDE) return;
    dispatch({ type: step.kind, mapId, team: step.team });
  }

  function handleSideClick(side: Side): void {
    if (
      state === null ||
      step === undefined ||
      step.kind !== VETO_STEP_KIND.SIDE ||
      step.mapId === undefined
    ) {
      return;
    }
    dispatch({ type: "side", mapId: step.mapId, team: step.team, side });
  }

  async function handleCopy(): Promise<void> {
    if (summary === undefined) return;
    const text = formatSummary(summary, vetoMaps, lang);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("summary.copy.toast"));
    } catch {
      toast.error(text);
    }
  }

  const sideMapName =
    step?.kind === VETO_STEP_KIND.SIDE ? mapById.get(step.mapId ?? "")?.name : undefined;

  // 1-based order among non-decider picked maps, for the "Map N" badge — mirrors summary order
  // while the veto is still in progress.
  const pickOrderByMapId = new Map<string, number>();
  let nextOrder = 1;
  for (const entry of state.log) {
    if (entry.type === "pick" && entry.by !== "decider") {
      pickOrderByMapId.set(entry.mapId, nextOrder);
      nextOrder += 1;
    }
  }

  const liveAnnouncement =
    step?.kind === VETO_STEP_KIND.SIDE
      ? t("veto.turn.side", { team: teamName(step.team), map: sideMapName ?? "" })
      : step?.kind === VETO_STEP_KIND.BAN
        ? t("veto.turn.ban", { team: teamName(step.team) })
        : step?.kind === VETO_STEP_KIND.PICK
          ? t("veto.turn.pick", { team: teamName(step.team) })
          : complete
            ? t("summary.title")
            : "";

  return (
    <section className="flex flex-col gap-4 pb-6" aria-labelledby="veto-heading">
      <h2 id="veto-heading" className="sr-only">
        {t("board.title.veto")}
      </h2>

      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {!complete && step && (
        <TurnBanner
          step={step}
          teamName={teamName}
          mapName={sideMapName}
          onUndo={undo}
          canUndo={canUndo}
        />
      )}

      {!complete && <VetoTimeline steps={describeSteps(state)} />}

      {step?.kind === VETO_STEP_KIND.SIDE && step.mapId !== undefined && (
        <SideChoice team={teamName(step.team)} map={sideMapName ?? ""} onChoose={handleSideClick} />
      )}

      {!complete && (
        <div className="grid grid-cols-1 gap-3 px-4 min-[480px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1440px]:grid-cols-4 md:gap-4 md:px-8">
          {vetoMaps.map((map) => {
            const mapState = state.maps[map.id];
            if (mapState === undefined) return null;
            const clickable =
              step !== undefined &&
              step.kind !== VETO_STEP_KIND.SIDE &&
              mapState.status === MAP_VETO_STATUS.AVAILABLE;
            return (
              <VetoMapCard
                key={map.id}
                map={map}
                mapState={mapState}
                teamA={state.config.teamA}
                teamB={state.config.teamB}
                clickable={clickable}
                order={pickOrderByMapId.get(map.id)}
                onSelect={() => handleMapClick(map.id)}
              />
            );
          })}
        </div>
      )}

      {complete && summary && (
        <VetoSummary
          summary={summary}
          maps={vetoMaps}
          onCopy={handleCopy}
          onNewVeto={reset}
          onReset={reset}
        />
      )}
    </section>
  );
}

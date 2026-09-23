import { BanIcon, CheckIcon, StarIcon } from "lucide-react";

import { MapImage } from "@/components/MapImage";
import { Badge } from "@/components/ui/badge";
import { MAP_VETO_STATUS, SIDE, TEAM, type MapVetoState, type Team } from "@/features/veto";
import type { GameMap } from "@/features/maps";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface VetoMapCardProps {
  map: GameMap;
  mapState: MapVetoState;
  teamA: string;
  teamB: string;
  /** Whether the acting team can act on this card right now. */
  clickable: boolean;
  /** 1-based order among played (non-decider) maps, shown on the "Map N" badge. */
  order?: number;
  onSelect: () => void;
}

function teamName(team: Team, teamA: string, teamB: string): string {
  return team === TEAM.A ? teamA : teamB;
}

/** A single map tile in the structured veto grid — clickable only during the acting team's turn. */
export function VetoMapCard({
  map,
  mapState,
  teamA,
  teamB,
  clickable,
  order,
  onSelect,
}: VetoMapCardProps) {
  const { t } = useI18n();

  const isBanned = mapState.status === MAP_VETO_STATUS.BANNED;
  const isPicked = mapState.status === MAP_VETO_STATUS.PICKED;
  const isDecider = isPicked && mapState.pickedBy === "decider";
  const pickedByTeam = isPicked && mapState.pickedBy !== "decider" ? mapState.pickedBy : undefined;

  const teamAccentClass =
    pickedByTeam === TEAM.A
      ? "bg-team-a text-team-a-foreground"
      : pickedByTeam === TEAM.B
        ? "bg-team-b text-team-b-foreground"
        : undefined;

  const card = (
    <div
      role="button"
      tabIndex={clickable ? 0 : -1}
      aria-disabled={!clickable}
      onClick={clickable ? onSelect : undefined}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group border-available-border bg-card relative aspect-video overflow-hidden rounded-md border outline-none",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-[border-color,box-shadow] duration-(--motion-base) ease-(--ease-standard)",
        clickable && "hover:border-primary/60 cursor-pointer",
        !clickable && "cursor-not-allowed",
        isBanned && "border-ban/50",
        isPicked && !isDecider && "border-pick border-2 shadow-card-active",
        isDecider && "border-decider border-2 shadow-card-active",
      )}
    >
      <MapImage
        src={map.splash}
        slug={map.slug}
        alt={map.name}
        className={cn(isBanned && "grayscale-[60%]")}
      />

      {isBanned && <div className="absolute inset-0 bg-black/55" />}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 from-0% to-transparent to-40%" />

      {isBanned && (
        <Badge className="bg-ban text-ban-foreground text-caption absolute top-2 right-2 gap-1 uppercase">
          <BanIcon className="size-3" />
          {t("card.badge.banned")}
        </Badge>
      )}

      {isDecider && (
        <Badge className="bg-decider text-decider-foreground text-caption absolute top-2 right-2 gap-1 uppercase">
          <StarIcon className="size-3" />
          {t("card.badge.decider")}
        </Badge>
      )}

      {pickedByTeam !== undefined && (
        <Badge
          className={cn(
            "text-mono text-caption absolute top-2 right-2 gap-1 font-mono",
            teamAccentClass,
          )}
        >
          <CheckIcon className="text-pick size-3" />
          {t("veto.badge.mapOrder", { n: order ?? "" })}
        </Badge>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
        <p className="text-display-md font-display truncate text-foreground uppercase">
          {map.name}
        </p>

        {isBanned && mapState.bannedBy !== undefined && (
          <span className="text-caption text-muted-foreground flex items-center gap-1">
            <span
              className={cn(
                "size-2 rounded-full",
                mapState.bannedBy === TEAM.A ? "bg-team-a" : "bg-team-b",
              )}
            />
            {t("veto.badge.bannedBy", { team: teamName(mapState.bannedBy, teamA, teamB) })}
          </span>
        )}

        {mapState.side !== undefined && (
          <Badge variant="outline" className="text-caption w-fit gap-1">
            {t("veto.side.chip", {
              team: teamName(mapState.side.team, teamA, teamB),
              side:
                mapState.side.side === SIDE.ATTACK ? t("veto.side.attack") : t("veto.side.defense"),
            })}
          </Badge>
        )}
      </div>
    </div>
  );

  return card;
}

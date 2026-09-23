import { CopyIcon, RotateCcwIcon } from "lucide-react";

import { MapImage } from "@/components/MapImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GameMap } from "@/features/maps";
import {
  SIDE,
  TEAM,
  type Side,
  type Team,
  type VetoSummary as VetoSummaryData,
} from "@/features/veto";
import { useI18n } from "@/i18n";

interface VetoSummaryProps {
  summary: VetoSummaryData;
  maps: GameMap[];
  onCopy: () => void;
  onNewVeto: () => void;
  onReset: () => void;
}

function opposite(side: Side): Side {
  return side === SIDE.ATTACK ? SIDE.DEFENSE : SIDE.ATTACK;
}

/** Post-veto result: ordered map list, collapsed bans, and copy/new-veto/reset actions. */
export function VetoSummary({ summary, maps, onCopy, onNewVeto, onReset }: VetoSummaryProps) {
  const { t } = useI18n();
  const teamName = (team: Team) => (team === TEAM.A ? summary.teamA : summary.teamB);
  const mapName = (mapId: string) => maps.find((map) => map.id === mapId)?.name ?? mapId;
  const mapBanner = (mapId: string) => maps.find((map) => map.id === mapId);

  return (
    <section className="flex flex-col gap-4 px-4 md:px-8" aria-labelledby="summary-heading">
      <div>
        <h2 id="summary-heading" className="text-display-lg font-display">
          {t("summary.title")}
        </h2>
        <p className="text-muted-foreground text-body-sm">
          {t("summary.subtitle", {
            teamA: summary.teamA,
            teamB: summary.teamB,
            format: summary.format.toUpperCase(),
          })}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {summary.playedMaps.map((played, index) => {
          const map = mapBanner(played.mapId);
          const isDecider = played.pickedBy === "decider";
          const sideA =
            played.side === undefined
              ? undefined
              : played.side.team === TEAM.A
                ? played.side.side
                : opposite(played.side.side);
          const sideB =
            played.side === undefined
              ? undefined
              : played.side.team === TEAM.B
                ? played.side.side
                : opposite(played.side.side);
          const sideLabel = (side: Side) =>
            side === SIDE.ATTACK ? t("veto.side.attack") : t("veto.side.defense");

          return (
            <li
              key={played.mapId}
              className="bg-card border-border flex gap-3 rounded-md border p-3"
            >
              <span className="text-mono text-muted-foreground w-6 shrink-0 font-mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              {map && (
                <span className="border-available-border h-[52px] w-64 max-w-[45%] shrink-0 overflow-hidden rounded-sm border">
                  <MapImage src={map.banner} slug={map.slug} alt="" className="h-full w-full" />
                </span>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isDecider ? (
                    <Badge className="bg-decider text-decider-foreground text-caption uppercase">
                      {t("card.badge.decider")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-caption">
                      {t("veto.badge.mapOrder", { n: index + 1 })}
                    </Badge>
                  )}
                  <span className="text-display-md font-display uppercase">
                    {mapName(played.mapId)}
                  </span>
                </div>
                {!isDecider && (
                  <p className="text-body-sm text-muted-foreground">
                    {t("summary.map.pickedBy", { team: teamName(played.pickedBy as Team) })}
                  </p>
                )}
                {sideA !== undefined && sideB !== undefined && (
                  <p className="text-body-sm text-muted-foreground">
                    {t("veto.side.chip", { team: summary.teamA, side: sideLabel(sideA) })} ·{" "}
                    {t("veto.side.chip", { team: summary.teamB, side: sideLabel(sideB) })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {summary.bannedMaps.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="bans">
            <AccordionTrigger>
              {t("summary.bans.toggle", { count: summary.bannedMaps.length })}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1">
                {summary.bannedMaps.map((ban) => (
                  <li key={ban.mapId} className="text-body-sm flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${ban.by === TEAM.A ? "bg-team-a" : "bg-team-b"}`}
                    />
                    {mapName(ban.mapId)} — {teamName(ban.by)}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onCopy}>
          <CopyIcon />
          {t("summary.copy")}
        </Button>
        <Button type="button" variant="outline" onClick={onNewVeto}>
          {t("summary.newVeto")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost">
              <RotateCcwIcon />
              {t("summary.reset")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("board.reset.confirm.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("board.reset.confirm.body")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("board.reset.confirm.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>
                {t("board.reset.confirm.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

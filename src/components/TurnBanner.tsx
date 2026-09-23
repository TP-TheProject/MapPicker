import { CheckIcon, SwordsIcon, Undo2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEAM, VETO_STEP_KIND, type Team, type VetoStep } from "@/features/veto";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface TurnBannerProps {
  step: VetoStep;
  teamName: (team: Team) => string;
  mapName?: string;
  onUndo: () => void;
  canUndo: boolean;
}

/** Sticky, high-visibility banner announcing whose turn it is and what action is required. */
export function TurnBanner({ step, teamName, mapName, onUndo, canUndo }: TurnBannerProps) {
  const { t } = useI18n();
  const isTeamA = step.team === TEAM.A;

  const copy =
    step.kind === VETO_STEP_KIND.SIDE
      ? t("veto.turn.side", { team: teamName(step.team), map: mapName ?? "" })
      : step.kind === VETO_STEP_KIND.BAN
        ? t("veto.turn.ban", { team: teamName(step.team) })
        : t("veto.turn.pick", { team: teamName(step.team) });

  return (
    <div
      className={cn(
        "bg-card sticky top-14 z-30 flex flex-wrap items-center justify-between gap-3 border-l-4 px-4 py-3 md:top-16 md:h-16 md:py-0",
        isTeamA ? "border-team-a" : "border-team-b",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("size-3 shrink-0 rounded-full", isTeamA ? "bg-team-a" : "bg-team-b")} />
        <Badge
          className={cn(
            "text-caption uppercase",
            step.kind === VETO_STEP_KIND.BAN
              ? "bg-ban text-ban-foreground"
              : "bg-pick text-pick-foreground",
          )}
        >
          {step.kind === VETO_STEP_KIND.BAN ? (
            <SwordsIcon className="size-3" />
          ) : (
            <CheckIcon className="size-3" />
          )}
          {step.kind}
        </Badge>
        <p
          key={copy}
          className="text-body-lg font-medium transition-opacity duration-(--motion-slow)"
        >
          {copy}
        </p>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
        <Undo2Icon />
        {t("veto.undo")}
      </Button>
    </div>
  );
}

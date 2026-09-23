import { ShieldIcon, SwordIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SIDE, type Side } from "@/features/veto";
import { useI18n } from "@/i18n";

interface SideChoiceProps {
  team: string;
  map: string;
  onChoose: (side: Side) => void;
}

/** Prompt shown after a pick (and for the decider): the picking team's opponent chooses side. */
export function SideChoice({ team, map, onChoose }: SideChoiceProps) {
  const { t } = useI18n();

  return (
    <div className="bg-card border-border mx-4 flex flex-col gap-3 rounded-md border p-4 md:mx-8">
      <p className="text-display-md font-display">{t("veto.side.prompt.title", { team, map })}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="flex-1" onClick={() => onChoose(SIDE.ATTACK)}>
          <SwordIcon />
          {t("veto.side.attack")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => onChoose(SIDE.DEFENSE)}
        >
          <ShieldIcon />
          {t("veto.side.defense")}
        </Button>
      </div>
    </div>
  );
}

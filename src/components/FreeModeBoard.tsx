import { KeyboardIcon, RotateCcwIcon, Undo2Icon } from "lucide-react";

import { FreeMapCard } from "@/components/FreeMapCard";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UseFreeModeResult } from "@/features/free";
import type { GameMap } from "@/features/maps";
import { useI18n } from "@/i18n";

interface FreeModeBoardProps {
  maps: GameMap[];
  /** Lifted `useFreeMode` binding — kept in the parent so it survives mode switches. */
  freeMode: UseFreeModeResult;
}

/** Free mode: click a map to pick it in order, ban a map to remove it from play. */
export function FreeModeBoard({ maps, freeMode }: FreeModeBoardProps) {
  const { t } = useI18n();
  const { state, pick, ban, undo, reset, canUndo } = freeMode;

  return (
    <section aria-labelledby="free-mode-heading" className="flex flex-col gap-4">
      <h2 id="free-mode-heading" className="sr-only">
        {t("board.title.free")}
      </h2>

      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="text-muted-foreground">
              <KeyboardIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("card.keyboard.hint")}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("card.keyboard.hint")}</TooltipContent>
        </Tooltip>

        <Button type="button" variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
          <Undo2Icon />
          {t("board.undo")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <RotateCcwIcon />
              {t("board.reset")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("board.reset.confirm.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("board.reset.confirm.body")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("board.reset.confirm.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => reset()}>
                {t("board.reset.confirm.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1440px]:grid-cols-4 md:gap-4">
        {maps.map((map) => {
          const cell = state.cells[map.id];
          if (cell === undefined) return null;
          return (
            <FreeMapCard
              key={map.id}
              map={map}
              cell={cell}
              onPick={() => pick(map.id)}
              onBan={() => ban(map.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

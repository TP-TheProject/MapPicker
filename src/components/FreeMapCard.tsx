import type { KeyboardEvent } from "react";
import { BanIcon, CheckIcon } from "lucide-react";

import { MapImage } from "@/components/MapImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAP_CELL_STATUS, type MapCellState } from "@/features/free";
import type { GameMap } from "@/features/maps";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface FreeMapCardProps {
  map: GameMap;
  cell: MapCellState;
  onPick: () => void;
  onBan: () => void;
}

/**
 * A landscape (16:9) map tile for free mode. Click/Enter picks, "B" or Delete bans — toggles
 * back to available if the same action is repeated on an already-picked/banned card.
 */
export function FreeMapCard({ map, cell, onPick, onBan }: FreeMapCardProps) {
  const { t } = useI18n();

  const isPicked = cell.status === MAP_CELL_STATUS.PICKED;
  const isBanned = cell.status === MAP_CELL_STATUS.BANNED;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      onPick();
    } else if (
      event.key.toLowerCase() === "b" ||
      event.key === "Delete" ||
      event.key === "Backspace"
    ) {
      event.preventDefault();
      onBan();
    }
  }

  const stateLabel = isPicked
    ? t("card.status.picked", { order: cell.order ?? 0 })
    : isBanned
      ? t("card.badge.banned")
      : t("card.status.available");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={handleKeyDown}
      aria-pressed={isPicked}
      aria-keyshortcuts="Enter B Delete"
      className={cn(
        "group border-available-border bg-card relative aspect-video overflow-hidden rounded-md border outline-none",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-[border-color,box-shadow] duration-(--motion-base) ease-(--ease-standard)",
        !isPicked && !isBanned && "hover:border-primary/60",
        isPicked && "border-pick border-2 shadow-card-active",
        isBanned && "border-ban/50",
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

      {isPicked && (
        <Badge className="bg-pick text-pick-foreground text-mono font-mono absolute top-2 right-2 size-8 justify-center rounded-full text-display-md">
          {cell.order}
        </Badge>
      )}

      {isBanned && (
        <Badge className="bg-ban text-ban-foreground text-caption absolute top-2 right-2 gap-1 uppercase">
          <BanIcon className="size-3" />
          {t("card.badge.banned")}
        </Badge>
      )}

      <div
        className={cn(
          "absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-(--motion-fast)",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          (isPicked || isBanned) && "hidden",
        )}
      >
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={t("card.pick", { map: map.name })}
          className="size-9 md:size-8"
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        >
          <CheckIcon />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={t("card.ban", { map: map.name })}
          className="size-9 md:size-8"
          onClick={(event) => {
            event.stopPropagation();
            onBan();
          }}
        >
          <BanIcon />
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <p
          className={cn(
            "text-display-md font-display truncate text-foreground uppercase",
            isBanned && "opacity-70",
          )}
        >
          {map.name}
        </p>
        <span className="sr-only">{stateLabel}</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { GridIcon } from "lucide-react";

import { MapImage } from "@/components/MapImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { POOL_PRESET, resolvePresetMapIds, type PoolPreset } from "@/config/pools";
import type { GameMap } from "@/features/maps";
import { useI18n } from "@/i18n";

const MIN_POOL_SELECTION = 2;
const LOCKED_HINT_ID = "pool-trigger-locked-hint";

interface PoolDialogProps {
  maps: GameMap[];
  selectedIds: string[];
  /** Commits a new pool selection — only called when the staged draft is applied. */
  onApply: (ids: string[]) => void;
  /** Controlled open state — falls back to internal state when omitted (e.g. header usage). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** True while a veto is active — disables the trigger and blocks opening. */
  locked?: boolean;
}

/**
 * Dialog for choosing which maps are in the active pool, with quick presets.
 *
 * Edits are staged in local draft state: checkboxes and presets only change the draft. The
 * draft is (re)seeded from `selectedIds` every time the dialog opens, so `Apply` commits it via
 * `onApply`, while `Cancel`, Escape, a backdrop click, or the close button all discard it —
 * `selectedIds` (the persisted selection) is left untouched.
 */
export function PoolDialog({
  maps,
  selectedIds,
  onApply,
  open: openProp,
  onOpenChange,
  locked = false,
}: PoolDialogProps) {
  const { t } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const requestedOpen = openProp ?? internalOpen;
  const open = locked ? false : requestedOpen;
  const setOpenRaw = onOpenChange ?? setInternalOpen;

  function setOpen(next: boolean): void {
    if (locked) return;
    setOpenRaw(next);
  }

  const [draft, setDraft] = useState<string[]>(selectedIds);
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(selectedIds);
    }
    wasOpenRef.current = open;
  }, [open, selectedIds]);

  const draftSelected = new Set(draft);
  const canApply = draft.length >= MIN_POOL_SELECTION;

  function toggleDraftMap(mapId: string): void {
    setDraft((prev) =>
      prev.includes(mapId) ? prev.filter((id) => id !== mapId) : [...prev, mapId],
    );
  }

  function applyDraftPreset(preset: PoolPreset): void {
    setDraft(resolvePresetMapIds(maps, preset));
  }

  function handleApply(): void {
    if (!canApply) return;
    onApply(draft);
    setOpen(false);
  }

  function handleCancel(): void {
    setOpen(false);
  }

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={locked}
      aria-describedby={locked ? LOCKED_HINT_ID : undefined}
    >
      <GridIcon />
      {t("app.pool.button", { count: selectedIds.length })}
    </Button>
  );

  const dialogTrigger = <DialogTrigger asChild>{triggerButton}</DialogTrigger>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {locked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{dialogTrigger}</span>
          </TooltipTrigger>
          <TooltipContent id={LOCKED_HINT_ID}>{t("pool.lockedDuringVeto")}</TooltipContent>
        </Tooltip>
      ) : (
        dialogTrigger
      )}
      <DialogContent className="gap-4">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="text-display-md font-display">{t("pool.title")}</DialogTitle>
          <Badge variant="outline" className="text-mono font-mono">
            {t("pool.count", { selected: draft.length, total: maps.length })}
          </Badge>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => applyDraftPreset(POOL_PRESET.ALL)}
          >
            {t("pool.preset.all")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => applyDraftPreset(POOL_PRESET.COMPETITIVE)}
          >
            {t("pool.preset.competitive")}
          </Button>
        </div>

        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {maps.map((map) => {
            const checked = draftSelected.has(map.id);
            return (
              <li key={map.id}>
                <Label
                  htmlFor={`pool-map-${map.id}`}
                  className="hover:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 font-normal"
                >
                  <Checkbox
                    id={`pool-map-${map.id}`}
                    checked={checked}
                    onCheckedChange={() => toggleDraftMap(map.id)}
                  />
                  <span className="border-available-border h-3 w-16 shrink-0 overflow-hidden rounded-sm border">
                    <MapImage src={map.banner} slug={map.slug} alt="" className="h-full w-full" />
                  </span>
                  <span className="text-body">{map.name}</span>
                </Label>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            {t("pool.cancel")}
          </Button>
          {canApply ? (
            <Button type="button" onClick={handleApply}>
              {t("pool.apply")}
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button type="button" disabled>
                    {t("pool.apply")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("pool.error.minSelection")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

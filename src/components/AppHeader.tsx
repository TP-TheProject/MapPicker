import { MenuIcon } from "lucide-react";

import { PoolDialog } from "@/components/PoolDialog";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { APP_MODE, type AppMode } from "@/config/modes";
import type { GameMap } from "@/features/maps";
import { LANGUAGE, useI18n } from "@/i18n";

interface AppHeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  maps: GameMap[];
  selectedPoolIds: string[];
  onApplyPool: (ids: string[]) => void;
  poolOpen: boolean;
  onPoolOpenChange: (open: boolean) => void;
  /** True while a veto is active — locks the pool entry point in both the desktop and mobile menus. */
  poolLocked: boolean;
}

/** Sticky app header: wordmark, mode switch, pool entry point, and language toggle. */
export function AppHeader({
  mode,
  onModeChange,
  maps,
  selectedPoolIds,
  onApplyPool,
  poolOpen,
  onPoolOpenChange,
  poolLocked,
}: AppHeaderProps) {
  const { t, lang, setLang } = useI18n();

  const modeSwitch = (
    <ToggleGroup
      type="single"
      aria-label={t("app.mode.toggle.label")}
      value={mode}
      onValueChange={(value) => {
        if (value) onModeChange(value as AppMode);
      }}
    >
      <ToggleGroupItem
        value={APP_MODE.FREE}
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        {t("app.mode.free")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value={APP_MODE.VETO}
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        {t("app.mode.veto")}
      </ToggleGroupItem>
    </ToggleGroup>
  );

  const poolDialog = (
    <PoolDialog
      maps={maps}
      selectedIds={selectedPoolIds}
      onApply={onApplyPool}
      open={poolOpen}
      onOpenChange={onPoolOpenChange}
      locked={poolLocked}
    />
  );

  const languageToggle = (
    <ToggleGroup
      type="single"
      aria-label={t("app.lang.toggle.label")}
      value={lang}
      onValueChange={(value) => {
        if (value) setLang(value as typeof lang);
      }}
    >
      <ToggleGroupItem value={LANGUAGE.PT} className="text-caption px-3">
        {t("app.lang.pt")}
      </ToggleGroupItem>
      <ToggleGroupItem value={LANGUAGE.EN} className="text-caption px-3">
        {t("app.lang.en")}
      </ToggleGroupItem>
    </ToggleGroup>
  );

  return (
    <header className="bg-background/85 border-border sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:h-16 md:px-8">
        <Wordmark compact className="md:hidden" />
        <Wordmark className="hidden md:inline" />

        <div className="hidden items-center gap-3 md:flex">
          {modeSwitch}
          {poolDialog}
          {languageToggle}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {languageToggle}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label={t("app.menu.open")}>
                <MenuIcon />
              </Button>
            </DialogTrigger>
            <DialogContent className="top-auto bottom-0 max-w-full translate-y-0 rounded-b-none rounded-t-xl sm:max-w-full">
              <DialogHeader>
                <DialogTitle className="sr-only">{t("app.menu.open")}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {modeSwitch}
                {poolDialog}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

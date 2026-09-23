import { useMemo, useState } from "react";
import { CloudOffIcon, GridIcon } from "lucide-react";

import { AppBackground } from "@/components/AppBackground";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { FreeModeBoard } from "@/components/FreeModeBoard";
import { MapGridSkeleton } from "@/components/MapGridSkeleton";
import { VetoBoard } from "@/components/VetoBoard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { APP_MODE, type AppMode } from "@/config/modes";
import { useFreeMode } from "@/features/free";
import { MAP_SOURCE, useMaps, usePoolSelection } from "@/features/maps";
import { useVeto } from "@/features/veto";
import { useI18n } from "@/i18n";

export function App() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AppMode>(APP_MODE.FREE);
  const [poolOpen, setPoolOpen] = useState(false);
  const [offlineNoticeDismissed, setOfflineNoticeDismissed] = useState(false);
  const { data, isLoading } = useMaps();

  const maps = data?.maps ?? [];
  const { selectedIds, selectedPool, setSelection } = usePoolSelection(maps);
  const poolMapIds = useMemo(() => selectedPool.map((map) => map.id), [selectedPool]);

  // Lifted here (rather than inside FreeModeBoard/VetoBoard) so board state survives mode
  // switches and any conditional rendering (e.g. the loading/empty-pool states below).
  const freeMode = useFreeMode(poolMapIds);
  const veto = useVeto();

  // A veto is "active" once started and until explicitly reset — covers in-progress and
  // completed-but-not-reset sessions alike.
  const vetoActive = veto.state !== null;

  const showOfflineNotice = data?.source === MAP_SOURCE.FALLBACK && !offlineNoticeDismissed;
  // Defensive: an active veto must never be unmounted by the empty-pool state, even though the
  // pool is locked (see `vetoActive` below) while a veto is running.
  const emptyPool = !isLoading && selectedPool.length < 2 && !vetoActive;

  return (
    <div className="mx-auto flex min-h-svh max-w-[1600px] flex-col">
      <AppBackground />

      <AppHeader
        mode={mode}
        onModeChange={setMode}
        maps={maps}
        selectedPoolIds={selectedIds}
        onApplyPool={setSelection}
        poolOpen={poolOpen}
        onPoolOpenChange={setPoolOpen}
        poolLocked={vetoActive}
      />

      <main className="flex flex-1 flex-col gap-4 py-6">
        {showOfflineNotice && (
          <div className="px-4 md:px-8">
            <Alert className="text-caption items-center gap-2">
              <CloudOffIcon />
              <AlertDescription className="flex flex-1 flex-wrap items-center justify-between gap-2 text-caption">
                <span>{t("state.offline.badge")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setOfflineNoticeDismissed(true)}
                >
                  ✕
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="px-4 md:px-8">
            <MapGridSkeleton />
          </div>
        ) : emptyPool ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <GridIcon className="text-muted-foreground size-10" aria-hidden="true" />
            <p className="text-display-md font-display">{t("state.emptyPool.title")}</p>
            <Button type="button" onClick={() => setPoolOpen(true)}>
              {t("state.emptyPool.action")}
            </Button>
          </div>
        ) : mode === APP_MODE.FREE ? (
          <div className="px-4 md:px-8">
            <FreeModeBoard maps={selectedPool} freeMode={freeMode} />
          </div>
        ) : (
          <VetoBoard pool={selectedPool} allMaps={maps} veto={veto} />
        )}
      </main>

      <AppFooter />
    </div>
  );
}

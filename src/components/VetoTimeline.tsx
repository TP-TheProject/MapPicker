import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { VetoPlanStep } from "@/features/veto";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface VetoTimelineProps {
  steps: VetoPlanStep[];
}

/** Horizontal (scrollable on mobile) row of step chips: done / current / upcoming. */
export function VetoTimeline({ steps }: VetoTimelineProps) {
  const { t } = useI18n();

  return (
    <div
      role="list"
      aria-label={t("veto.step.label", { n: "" })}
      className="border-border flex gap-2 overflow-x-auto border-t px-4 py-2 md:px-8"
    >
      {steps.map((step, index) => {
        const code =
          step.kind === "decider"
            ? t("card.badge.decider")
            : `${step.team} ${t(`veto.step.${step.kind}`)}`;

        return (
          <Badge
            key={index}
            role="listitem"
            variant="outline"
            className={cn(
              "text-caption shrink-0 gap-1.5 uppercase",
              step.done && "bg-muted text-muted-foreground border-transparent",
              step.current && "bg-primary/15 border-primary text-foreground",
              !step.done &&
                !step.current &&
                "text-muted-foreground/70 border-border bg-transparent",
            )}
          >
            <span className="text-mono font-mono">{index + 1}</span>
            {code}
            {step.done && <CheckIcon className="size-3" />}
          </Badge>
        );
      })}
    </div>
  );
}

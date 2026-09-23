import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MIN_POOL_SIZE, VETO_FORMAT, type VetoError, type VetoFormat } from "@/features/veto";
import { useI18n } from "@/i18n";

function createSetupSchema(duplicateTeamNameMessage: string) {
  return z
    .object({
      teamA: z.string().trim().min(1),
      teamB: z.string().trim().min(1),
      format: z.enum([VETO_FORMAT.BO1, VETO_FORMAT.BO3, VETO_FORMAT.BO5]),
    })
    .refine((data) => data.teamA.trim().toLowerCase() !== data.teamB.trim().toLowerCase(), {
      message: duplicateTeamNameMessage,
      path: ["teamB"],
    });
}

export type VetoSetupValues = z.infer<ReturnType<typeof createSetupSchema>>;

interface VetoSetupFormProps {
  onSubmit: (values: VetoSetupValues) => void;
  poolSize: number;
  error?: VetoError;
}

const FORMAT_LABEL_KEY = {
  [VETO_FORMAT.BO1]: "setup.format.bo1",
  [VETO_FORMAT.BO3]: "setup.format.bo3",
  [VETO_FORMAT.BO5]: "setup.format.bo5",
} as const;

/** Collects team names and match format before a structured veto starts. */
export function VetoSetupForm({ onSubmit, poolSize, error }: VetoSetupFormProps) {
  const { t } = useI18n();
  const setupSchema = useMemo(() => createSetupSchema(t("setup.error.duplicateTeamName")), [t]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VetoSetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { teamA: "", teamB: "", format: VETO_FORMAT.BO1 },
  });

  const format = watch("format");
  const minSize = MIN_POOL_SIZE[format];
  const poolTooSmall = poolSize < minSize;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border-border mx-auto flex max-w-lg flex-col gap-4 rounded-md border p-6"
      aria-labelledby="veto-setup-heading"
    >
      <h2 id="veto-setup-heading" className="text-display-lg font-display">
        {t("setup.title")}
      </h2>

      <div className="flex flex-col gap-1">
        <Label htmlFor="veto-team-a">
          <span className="bg-team-a inline-block size-3 rounded-full" />
          {t("setup.teamA.label")}
        </Label>
        <Input id="veto-team-a" aria-invalid={!!errors.teamA} {...register("teamA")} />
        {errors.teamA && <p className="text-destructive text-body-sm">{errors.teamA.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="veto-team-b">
          <span className="bg-team-b inline-block size-3 rounded-full" />
          {t("setup.teamB.label")}
        </Label>
        <Input id="veto-team-b" aria-invalid={!!errors.teamB} {...register("teamB")} />
        {errors.teamB && <p className="text-destructive text-body-sm">{errors.teamB.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t("setup.format.label")}</Label>
        <ToggleGroup
          type="single"
          value={format}
          onValueChange={(value) => {
            if (value) setValue("format", value as VetoFormat);
          }}
        >
          <ToggleGroupItem value={VETO_FORMAT.BO1}>{t("setup.format.bo1")}</ToggleGroupItem>
          <ToggleGroupItem value={VETO_FORMAT.BO3}>{t("setup.format.bo3")}</ToggleGroupItem>
          <ToggleGroupItem value={VETO_FORMAT.BO5}>{t("setup.format.bo5")}</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-caption text-muted-foreground">{t("setup.requirement.helper")}</p>
        {poolTooSmall && (
          <p id="veto-pool-size-error" className="text-body-sm text-destructive">
            {t("setup.error.poolTooSmall", {
              format: t(FORMAT_LABEL_KEY[format]),
              min: minSize,
              count: poolSize,
            })}
          </p>
        )}
      </div>

      {error && <p className="text-destructive text-body-sm">{error.message}</p>}

      <Button
        type="submit"
        disabled={poolTooSmall}
        aria-describedby={poolTooSmall ? "veto-pool-size-error" : undefined}
        className="w-full"
      >
        {t("setup.start")}
      </Button>
    </form>
  );
}

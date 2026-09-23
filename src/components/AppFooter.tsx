import { useI18n } from "@/i18n";

const VALORANT_API_URL = "https://valorant-api.com";

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-border text-caption text-muted-foreground border-t px-4 py-4 text-center">
      <p>{t("footer.disclaimer")}</p>
      <p>
        <a
          href={VALORANT_API_URL}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline focus-visible:underline"
        >
          {t("footer.credit")}
        </a>
      </p>
    </footer>
  );
}

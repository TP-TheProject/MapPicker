import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  detectLanguage,
  DICTIONARIES,
  interpolate,
  LANGUAGE_STORAGE_KEY,
  type Language,
  type MessageKey,
} from "@/i18n";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function defaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  return detectLanguage(navigator.language);
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [storedLang, setStoredLang] = useLocalStorage<Language | null>(LANGUAGE_STORAGE_KEY, null);
  const [lang, setLangState] = useState<Language>(() => storedLang ?? defaultLanguage());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      setStoredLang(next);
    },
    [setStoredLang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => interpolate(DICTIONARIES[lang][key], params),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

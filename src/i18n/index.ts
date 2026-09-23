import { en, type MessageKey } from "@/i18n/en";
import { pt } from "@/i18n/pt";

export const LANGUAGE = {
  EN: "en",
  PT: "pt",
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const DICTIONARIES: Record<Language, Record<MessageKey, string>> = { en, pt };

export const LANGUAGE_STORAGE_KEY = "mappicker:lang";

/** Detects a default language from the browser locale: pt* -> pt, everything else -> en. */
export function detectLanguage(navigatorLanguage: string): Language {
  return navigatorLanguage.toLowerCase().startsWith("pt") ? LANGUAGE.PT : LANGUAGE.EN;
}

/** Replaces `{param}` placeholders in a message with values from `params`. */
export function interpolate(message: string, params?: Record<string, string | number>): string {
  if (params === undefined) return message;
  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export type { MessageKey } from "@/i18n/en";
export { useI18n, I18nProvider } from "@/i18n/I18nContext";

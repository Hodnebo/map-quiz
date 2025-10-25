import type { Locale } from './config';
import { locales, defaultLocale } from './config';

/**
 * Detect the user's preferred language from the browser
 * Returns a supported locale or the default locale
 */
export function detectBrowserLocale(): Locale {
  // Only detect in browser environment
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  // Get browser language(s)
  const browserLang = navigator.language || navigator.languages?.[0] || '';

  // Extract language code (e.g., 'en' from 'en-US')
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if the language code matches a supported locale
  if (locales.includes(langCode as Locale)) {
    return langCode as Locale;
  }

  // Check if browser language starts with a supported locale
  // e.g., 'no-BO' should match 'no'
  const matchedLocale = locales.find(locale =>
    browserLang.toLowerCase().startsWith(locale)
  );

  return matchedLocale || defaultLocale;
}

import type { Locale } from './config';
import { defaultLocale } from './config';
import en from './translations/en.json';
import no from './translations/no.json';

const translations: Record<Locale, typeof en> = {
  en,
  no,
};

/**
 * Get translations for a specific locale
 */
export function getTranslations(locale: Locale = defaultLocale) {
  return translations[locale] || translations[defaultLocale];
}

/**
 * Get a nested translation value by dot notation path
 * Example: t('modal.title') returns the modal title
 */
export function t(path: string, locale: Locale = defaultLocale, variables?: Record<string, string | number>): string {
  const translations = getTranslations(locale);

  let current: any = translations;
  for (const segment of path.split('.')) {
    current = current?.[segment];
  }

  if (typeof current !== 'string') {
    return path; // Return the path as fallback if translation not found
  }

  // Replace variables like {count} with actual values
  if (variables) {
    return Object.entries(variables).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      current
    );
  }

  return current;
}

export type { Locale };

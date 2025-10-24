export type Locale = 'en' | 'no';

export const locales: Locale[] = ['en', 'no'];
export const defaultLocale: Locale = 'no';

export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && locales.includes(locale as Locale);
}

export const LOCALES = ['ru', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value)

/**
 * Picks the first supported locale from a list of BCP 47 tags in order of preference
 * (e.g. `navigator.languages`). Region subtags are ignored: `ru-RU` → `ru`.
 */
export function resolveLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const language = tag.toLowerCase().split('-')[0] ?? ''
    if (isLocale(language)) return language
  }
  return DEFAULT_LOCALE
}

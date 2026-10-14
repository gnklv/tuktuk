// Public API of @tuktuk/core: domain entities, rules and application use cases.
// Must stay framework-agnostic: no Vue, no browser or Node APIs.
export { LOCALES, DEFAULT_LOCALE, isLocale, resolveLocale } from './domain/locale'
export type { Locale } from './domain/locale'
export type { Clock } from './application/ports/clock'

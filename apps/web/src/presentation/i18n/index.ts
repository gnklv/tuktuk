import { createI18n, useI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, type Locale } from '@tuktuk/core'
import { en, type MessageSchema } from './messages/en'
import { ru } from './messages/ru'

const dateFormats = {
  dayLong: { weekday: 'long', day: 'numeric', month: 'long' },
} as const

/** Dot-separated paths to leaf strings: `{ a: { b: '' } }` → `'a.b'`. */
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`
}[keyof T & string]

export type MessageKey = LeafPaths<MessageSchema>
export type DateFormat = keyof typeof dateFormats

export const LOCALE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
}

export function createAppI18n(locale: Locale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { en, ru },
    datetimeFormats: { en: dateFormats, ru: dateFormats },
  })
}

/**
 * Strictly typed `useI18n`: vue-i18n's own `t`/`d` accept any string,
 * so typos in keys would only show up at runtime.
 */
export function useAppI18n() {
  const i18n = useI18n<{ message: MessageSchema }, Locale>({ useScope: 'global' })
  return {
    locale: i18n.locale,
    t: (key: MessageKey, named: Record<string, unknown> = {}) => i18n.t(key, named),
    d: (value: Date | number, format: DateFormat) => i18n.d(value, format),
  }
}

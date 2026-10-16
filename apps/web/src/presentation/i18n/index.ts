import { createI18n, useI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, type Locale } from '@tuktuk/core'
import { messages, russianPlural, type MessageSchema } from '@tuktuk/i18n'

const dateFormats = {
  dayLong: { weekday: 'long', day: 'numeric', month: 'long' },
  time: { hour: '2-digit', minute: '2-digit' },
} as const

/** Dot-separated paths to leaf strings: `{ a: { b: '' } }` → `'a.b'`. Lists are skipped. */
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends readonly unknown[]
      ? never
      : `${K}.${LeafPaths<T[K]>}`
}[keyof T & string]

export type MessageKey = LeafPaths<MessageSchema>
export type DateFormat = keyof typeof dateFormats

export function createAppI18n(locale: Locale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    messages,
    datetimeFormats: { en: dateFormats, ru: dateFormats },
    pluralRules: { ru: russianPlural },
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
    /** Plural message (`'{n} день | {n} дня | {n} дней'`), `{n}` is the count. */
    tn: (key: MessageKey, count: number, named: Record<string, unknown> = {}) =>
      i18n.t(key, { n: count, ...named }, count),
    d: (value: Date | number, format: DateFormat) => i18n.d(value, format),
  }
}

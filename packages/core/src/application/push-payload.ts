import { isLocale, type Locale } from '../domain/locale'

/**
 * What the push server sends to a device. The Service Worker turns it into a notification,
 * so task titles never leave the device: the server only knows counts and settings.
 */
export type PushPayload = { readonly type: 'test'; readonly locale: Locale }

/** Parses untrusted push data; `null` if it's not a payload this app version understands. */
export function parsePushPayload(data: unknown): PushPayload | null {
  if (typeof data !== 'object' || data === null) return null
  const { type, locale } = data as Record<string, unknown>
  if (type === 'test' && typeof locale === 'string' && isLocale(locale)) {
    return { type, locale }
  }
  return null
}

import {
  DEFAULT_LOCALE,
  composeNudge,
  isLocale,
  nudgeMood,
  parsePushPayload,
  type Locale,
  type NudgeCopy,
  type NudgeMood,
} from '@tuktuk/core'
import type { PushTitlesSource } from './ports'

/** Texts a push may need besides reminder wording. */
export interface PushTexts {
  appName: string
  /** Said when the device has no titles to name (e.g. storage was cleared). */
  fallback(mood: NudgeMood): string
}

export interface ComposedPush {
  readonly title: string
  readonly body: string
}

/**
 * Turns push data from the server into a notification, on the device. Titles never leave
 * the device, so they're read locally. Always returns something: iOS revokes push access
 * when a push doesn't show a notification.
 */
export function makeComposePush(deps: {
  titles: PushTitlesSource
  copy: NudgeCopy
  texts: (locale: Locale) => PushTexts
  random: () => number
}) {
  return async (data: unknown): Promise<ComposedPush> => {
    const payload = parsePushPayload(data)
    const texts = deps.texts(payload?.locale ?? localeOf(data))
    if (!payload) return { title: texts.appName, body: '' }

    // A reminder: the same wording rules as in the app.
    try {
      const pendingTitles = await deps.titles.forDate(payload.date)
      if (pendingTitles.length > 0) {
        const message = composeNudge(deps.copy, {
          locale: payload.locale,
          pressure: payload.pressure,
          pendingTitles,
          previousId: await deps.titles.lastMessageId(),
          random: deps.random,
        })
        await deps.titles.setLastMessageId(message.id)
        return { title: message.title, body: message.body }
      }
    } catch (error) {
      console.warn('[push] could not read local titles', error)
    }
    const mood = nudgeMood(payload.pressure)
    return { title: deps.copy.title(payload.locale, mood), body: texts.fallback(mood) }
  }
}

/** The locale of data this version doesn't understand (e.g. a newer push type), if it has one. */
function localeOf(data: unknown): Locale {
  const locale = (data as { locale?: unknown } | null)?.locale
  return typeof locale === 'string' && isLocale(locale) ? locale : DEFAULT_LOCALE
}

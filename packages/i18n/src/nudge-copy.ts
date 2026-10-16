import type { Locale, NudgeCopy } from '@tuktuk/core'
import { messages } from './messages'

const interpolate = (template: string, params: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))

/** Reminder wording for the core, taken from the same dictionaries as the UI. */
export const nudgeCopy: NudgeCopy = {
  title: (locale, mood) => messages[locale].nudge.titles[mood],
  variants: (locale, mood) => messages[locale].nudge.variants[mood],
  duration: (locale, minutes) => formatDuration(locale, minutes),
}

/** `3 ч 20 мин`, `45 min`, `2 h`. */
export function formatDuration(locale: Locale, minutes: number): string {
  const { duration } = messages[locale]
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return interpolate(duration.minutes, { m })
  if (m === 0) return interpolate(duration.hours, { h })
  return interpolate(duration.hoursMinutes, { h, m })
}

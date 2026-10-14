import type { Locale } from './locale'
import { timeOfDay, type TimeOfDay, type TimeRange } from './time-of-day'

export interface Settings {
  readonly locale: Locale
  /** IANA timezone, e.g. `Europe/Moscow`. Defines where a day starts and ends. */
  readonly timeZone: string
  /** When the day's tasks are due. Reminders escalate towards it. */
  readonly dayDeadline: TimeOfDay
  /** No reminders in this range. `null` = never quiet. */
  readonly quietHours: TimeRange | null
}

export function createDefaultSettings(env: { locale: Locale; timeZone: string }): Settings {
  return {
    locale: env.locale,
    timeZone: env.timeZone,
    dayDeadline: timeOfDay(23),
    quietHours: { start: timeOfDay(23, 30), end: timeOfDay(8) },
  }
}

import type { Locale } from './locale'
import { DomainError } from './shared/domain-error'
import { isWithinRange, timeOfDay, type TimeOfDay, type TimeRange } from './time-of-day'

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export interface Settings {
  readonly locale: Locale
  /** IANA timezone, e.g. `Europe/Moscow`. Defines where a day starts and ends. */
  readonly timeZone: string
  /** When the day's tasks are due. Reminders escalate towards it. 1440 = midnight at the end of the day. */
  readonly dayDeadline: TimeOfDay
  /** No reminders in this range. `null` = never quiet. */
  readonly quietHours: TimeRange | null
  /** UI-only preference; the reminder engine ignores it. */
  readonly theme: Theme
}

export function createDefaultSettings(env: { locale: Locale; timeZone: string }): Settings {
  return {
    locale: env.locale,
    timeZone: env.timeZone,
    dayDeadline: timeOfDay(23),
    quietHours: { start: timeOfDay(23, 30), end: timeOfDay(8) },
    theme: 'system',
  }
}

/** Applies a change and enforces the rules that keep reminders meaningful. */
export function changeSettings(current: Settings, patch: Partial<Settings>): Settings {
  const next = { ...current, ...patch }
  validateSettings(next)
  return next
}

export function validateSettings(settings: Settings): void {
  const { dayDeadline, quietHours } = settings
  if (dayDeadline === 0) throw new DomainError('settings.deadlineAtDayStart')
  if (quietHours) {
    if (quietHours.start === quietHours.end) throw new DomainError('settings.quietHoursEmpty')
    // The last hours before the deadline matter most — they must not be silenced.
    // A deadline exactly at the start of quiet hours is fine: the range is [start, end).
    if (
      isWithinRange((dayDeadline % 1440) as TimeOfDay, quietHours) &&
      dayDeadline !== quietHours.start
    ) {
      throw new DomainError('settings.deadlineInQuietHours')
    }
  }
}

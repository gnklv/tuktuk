import { parseLocalDate, type LocalDate } from '../domain/local-date'
import { isLocale, type Locale } from '../domain/locale'
import { PRESSURE_LEVELS, type DayPressure, type PressureLevel } from '../domain/pressure'

/**
 * What the push server sends to a device. The Service Worker turns it into a notification,
 * so task titles never leave the device: the server only knows counts and settings.
 */
export interface PushPayload {
  /** Always set, so newer kinds of pushes can be told apart (and ignored) by older apps. */
  readonly type: 'nudge'
  readonly locale: Locale
  /** The user's day the reminder is about — picks the matching local task titles. */
  readonly date: LocalDate
  readonly pressure: DayPressure
}

/** Parses untrusted push data; `null` if it's not a payload this app version understands. */
export function parsePushPayload(data: unknown): PushPayload | null {
  if (typeof data !== 'object' || data === null) return null
  const { type, locale, date, pressure } = data as Record<string, unknown>
  if (typeof locale !== 'string' || !isLocale(locale)) return null

  if (type === 'nudge') {
    try {
      return { type, locale, date: parseLocalDate(String(date)), pressure: parsePressure(pressure) }
    } catch {
      return null
    }
  }
  return null
}

function parsePressure(value: unknown): DayPressure {
  const { value: v, level, elapsed, minutesLeft, overdue } = value as Record<string, unknown>
  const unit = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 1
  if (
    !unit(v) ||
    !unit(elapsed) ||
    !PRESSURE_LEVELS.includes(level as PressureLevel) ||
    !Number.isInteger(minutesLeft) ||
    (minutesLeft as number) < 0 ||
    typeof overdue !== 'boolean'
  ) {
    throw new Error('pressure')
  }
  return {
    value: v,
    level: level as PressureLevel,
    elapsed,
    minutesLeft: minutesLeft as number,
    overdue,
  }
}

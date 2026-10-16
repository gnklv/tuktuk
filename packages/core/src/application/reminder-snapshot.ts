import { parseLocalDate, type LocalDate } from '../domain/local-date'
import { isLocale } from '../domain/locale'
import { validateSettings, type Settings } from '../domain/settings'
import { MINUTES_IN_DAY, type TimeOfDay, type TimeRange } from '../domain/time-of-day'

/**
 * What the push server needs to decide when to remind: settings and task counts.
 * No task titles — they never leave the device.
 */
export interface ReminderSnapshot {
  readonly settings: ReminderSettings
  /** Today and the next days, so reminders keep coming even if the app isn't opened. */
  readonly days: readonly DayCounts[]
}

export type ReminderSettings = Pick<Settings, 'locale' | 'timeZone' | 'dayDeadline' | 'quietHours'>

export interface DayCounts {
  readonly date: LocalDate
  readonly total: number
  readonly pending: number
}

/** How many days ahead the snapshot covers, today included. */
export const SNAPSHOT_DAYS = 7

const MAX_DAYS = 14
const MAX_TASKS = 1000

export function dayCountsOn(snapshot: ReminderSnapshot, date: LocalDate): DayCounts | null {
  return snapshot.days.find((day) => day.date === date) ?? null
}

/** Parses untrusted input (an HTTP body); `null` if anything is off. */
export function parseReminderSnapshot(data: unknown): ReminderSnapshot | null {
  try {
    const { settings, days } = data as { settings: unknown; days: unknown }
    const parsedSettings = parseSettings(settings)
    if (!Array.isArray(days) || days.length > MAX_DAYS) return null
    const parsedDays = days.map(parseDay)
    if (new Set(parsedDays.map((d) => d.date)).size !== parsedDays.length) return null
    return { settings: parsedSettings, days: parsedDays }
  } catch {
    return null
  }
}

function parseSettings(value: unknown): ReminderSettings {
  const { locale, timeZone, dayDeadline, quietHours } = value as Record<string, unknown>
  if (typeof locale !== 'string' || !isLocale(locale)) throw new Error('locale')
  if (typeof timeZone !== 'string') throw new Error('timeZone')
  new Intl.DateTimeFormat('en', { timeZone }) // throws on an unknown timezone
  const settings: ReminderSettings = {
    locale,
    timeZone,
    dayDeadline: parseTime(dayDeadline),
    quietHours: quietHours === null ? null : parseRange(quietHours),
  }
  validateSettings({ ...settings, theme: 'system' })
  return settings
}

function parseRange(value: unknown): TimeRange {
  const { start, end } = value as Record<string, unknown>
  return { start: parseTime(start), end: parseTime(end) }
}

function parseTime(value: unknown): TimeOfDay {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > MINUTES_IN_DAY) {
    throw new Error('time')
  }
  return value as TimeOfDay
}

function parseDay(value: unknown): DayCounts {
  const { date, total, pending } = value as Record<string, unknown>
  if (typeof date !== 'string') throw new Error('date')
  const isCount = (n: unknown): n is number =>
    Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_TASKS
  if (!isCount(total) || !isCount(pending) || pending > total) throw new Error('counts')
  return { date: parseLocalDate(date), total, pending }
}

import { parseLocalDate, type LocalDate } from '../domain/local-date'
import { restoreSettings, type Settings } from '../domain/settings'

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
  // Same rules as stored settings; the theme is irrelevant to the server.
  const { locale, timeZone, dayDeadline, quietHours } = restoreSettings({
    ...(value as object),
    theme: 'system',
  })
  return { locale, timeZone, dayDeadline, quietHours }
}

function parseDay(value: unknown): DayCounts {
  const { date, total, pending } = value as Record<string, unknown>
  if (typeof date !== 'string') throw new Error('date')
  const isCount = (n: unknown): n is number =>
    Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_TASKS
  if (!isCount(total) || !isCount(pending) || pending > total) throw new Error('counts')
  return { date: parseLocalDate(date), total, pending }
}

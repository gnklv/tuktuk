import type { Locale, TaskSchedule, Weekday } from '@tuktuk/core'
import { useAppI18n } from '.'

/** Monday-first, ISO order. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]

const MONDAY_UTC = Date.UTC(2024, 0, 1) // 2024-01-01 was a Monday
const DAY_MS = 86_400_000

/** Localized weekday name via Intl, capitalized: `Пн`, `Mon`. */
export function weekdayName(weekday: Weekday, locale: Locale): string {
  const name = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(MONDAY_UTC + (weekday - 1) * DAY_MS),
  )
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const sameDays = (a: readonly Weekday[], b: readonly Weekday[]) =>
  a.length === b.length && a.every((d, i) => d === b[i])

/** Human-readable schedule of a habit, `null` for one-off tasks. */
export function useScheduleLabel() {
  const { t, locale } = useAppI18n()

  return (schedule: TaskSchedule): string | null => {
    if (schedule.kind === 'once') return null
    const days = schedule.weekdays
    if (sameDays(days, WEEKDAYS)) return t('schedule.everyDay')
    if (sameDays(days, [1, 2, 3, 4, 5])) return t('schedule.weekdays')
    if (sameDays(days, [6, 7])) return t('schedule.weekends')
    return days.map((d) => weekdayName(d, locale.value)).join(', ')
  }
}

import { pendingCount } from '../../domain/day-overview'
import { datesFrom, type LocalDate } from '../../domain/local-date'
import type { Settings } from '../../domain/settings'
import { makeLoadHistory } from '../history'
import { SNAPSHOT_DAYS, type ReminderSnapshot } from '../reminder-snapshot'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

/** Builds what the push server is allowed to know: settings and counts, no titles. */
export const makeGetReminderSnapshot = (deps: {
  taskRepo: TaskRepository
  completionRepo: CompletionRepository
}) => {
  const loadHistory = makeLoadHistory(deps)
  return async (settings: Settings, today: LocalDate): Promise<ReminderSnapshot> => {
    const dates = datesFrom(today, SNAPSHOT_DAYS)
    const history = await loadHistory(today, dates.at(-1)!)
    const { locale, timeZone, dayDeadline, quietHours } = settings
    return {
      settings: { locale, timeZone, dayDeadline, quietHours },
      days: dates.map((date) => {
        const day = history.day(date)
        return { date, total: day.items.length, pending: pendingCount(day) }
      }),
    }
  }
}

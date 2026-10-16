import { pendingTitles } from '../../domain/day-overview'
import { datesFrom, type LocalDate } from '../../domain/local-date'
import { makeLoadHistory } from '../history'
import { SNAPSHOT_DAYS } from '../reminder-snapshot'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

/** Titles of pending tasks per day, for the same days as the snapshot. Stays on the device. */
export type PendingTitles = Record<LocalDate, readonly string[]>

export const makeGetPendingTitles = (deps: {
  taskRepo: TaskRepository
  completionRepo: CompletionRepository
}) => {
  const loadHistory = makeLoadHistory(deps)
  return async (today: LocalDate): Promise<PendingTitles> => {
    const dates = datesFrom(today, SNAPSHOT_DAYS)
    const history = await loadHistory(today, dates.at(-1)!)
    return Object.fromEntries(dates.map((date) => [date, pendingTitles(history.day(date))]))
  }
}

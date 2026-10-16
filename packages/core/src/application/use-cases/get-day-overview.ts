import type { DayOverview } from '../../domain/day-overview'
import type { LocalDate } from '../../domain/local-date'
import { makeLoadHistory } from '../history'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

export const makeGetDayOverview = (deps: {
  taskRepo: TaskRepository
  completionRepo: CompletionRepository
}) => {
  const loadHistory = makeLoadHistory(deps)
  return async (date: LocalDate): Promise<DayOverview> => (await loadHistory(date, date)).day(date)
}

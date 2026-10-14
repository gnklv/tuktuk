import { buildDayOverview, type DayOverview } from '../../domain/day-overview'
import type { LocalDate } from '../../domain/local-date'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

export const makeGetDayOverview =
  (deps: { taskRepo: TaskRepository; completionRepo: CompletionRepository }) =>
  async (date: LocalDate): Promise<DayOverview> => {
    const [tasks, completions] = await Promise.all([
      deps.taskRepo.getAll(),
      deps.completionRepo.getByDate(date),
    ])
    return buildDayOverview(date, tasks, completions)
  }

import type { Completion } from '../domain/completion'
import { buildDayOverview, type DayOverview } from '../domain/day-overview'
import type { LocalDate } from '../domain/local-date'
import type { Task } from '../domain/task'
import type { CompletionRepository } from './ports/completion-repository'
import type { TaskRepository } from './ports/task-repository'

/** Tasks and completions for a range of days, read once. */
export interface History {
  readonly tasks: readonly Task[]
  readonly completions: readonly Completion[]
  /** What a day within the loaded range looks like. */
  day(date: LocalDate): DayOverview
}

export const makeLoadHistory =
  (deps: { taskRepo: TaskRepository; completionRepo: CompletionRepository }) =>
  async (from: LocalDate, to: LocalDate): Promise<History> => {
    const [tasks, completions] = await Promise.all([
      deps.taskRepo.getAll(),
      deps.completionRepo.getInRange(from, to),
    ])
    return { tasks, completions, day: (date) => buildDayOverview(date, tasks, completions) }
  }

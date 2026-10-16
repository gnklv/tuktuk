import { buildDayOverview } from '../../domain/day-overview'
import { addDays, type LocalDate } from '../../domain/local-date'
import { SNAPSHOT_DAYS } from '../reminder-snapshot'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

/** Titles of pending tasks per day, for the same days as the snapshot. Stays on the device. */
export type PendingTitles = Record<LocalDate, readonly string[]>

export const makeGetPendingTitles =
  (deps: { taskRepo: TaskRepository; completionRepo: CompletionRepository }) =>
  async (today: LocalDate): Promise<PendingTitles> => {
    const dates = Array.from({ length: SNAPSHOT_DAYS }, (_, i) => addDays(today, i))
    const [tasks, completions] = await Promise.all([
      deps.taskRepo.getAll(),
      deps.completionRepo.getInRange(today, dates.at(-1)!),
    ])
    return Object.fromEntries(
      dates.map((date) => [
        date,
        buildDayOverview(date, tasks, completions)
          .items.filter((item) => item.completedAt === null)
          .map((item) => item.task.title),
      ]),
    )
  }

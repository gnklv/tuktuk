import { buildDayOverview } from '../../domain/day-overview'
import { addDays, type LocalDate } from '../../domain/local-date'
import type { Settings } from '../../domain/settings'
import { SNAPSHOT_DAYS, type ReminderSnapshot } from '../reminder-snapshot'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

/** Builds what the push server is allowed to know: settings and counts, no titles. */
export const makeGetReminderSnapshot =
  (deps: { taskRepo: TaskRepository; completionRepo: CompletionRepository }) =>
  async (settings: Settings, today: LocalDate): Promise<ReminderSnapshot> => {
    const dates = Array.from({ length: SNAPSHOT_DAYS }, (_, i) => addDays(today, i))
    const [tasks, completions] = await Promise.all([
      deps.taskRepo.getAll(),
      deps.completionRepo.getInRange(today, dates.at(-1)!),
    ])
    return {
      settings: {
        locale: settings.locale,
        timeZone: settings.timeZone,
        dayDeadline: settings.dayDeadline,
        quietHours: settings.quietHours,
      },
      days: dates.map((date) => {
        const day = buildDayOverview(date, tasks, completions)
        return { date, total: day.items.length, pending: day.items.length - day.doneCount }
      }),
    }
  }

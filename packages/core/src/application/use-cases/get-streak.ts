import { addDays, type LocalDate } from '../../domain/local-date'
import {
  STREAK_LOOKBACK_DAYS,
  computeStreak,
  dayResult,
  type DayResult,
  type Streak,
} from '../../domain/streak'
import { makeLoadHistory } from '../history'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

export interface StreakOverview {
  readonly streak: Streak
  /** How yesterday went — for the "yesterday you…" summary. */
  readonly yesterday: {
    readonly date: LocalDate
    readonly result: DayResult
    readonly done: number
    readonly total: number
  }
}

export const makeGetStreak = (deps: {
  taskRepo: TaskRepository
  completionRepo: CompletionRepository
}) => {
  const loadHistory = makeLoadHistory(deps)
  return async (today: LocalDate): Promise<StreakOverview> => {
    const yesterday = addDays(today, -1)
    const { tasks, completions, day } = await loadHistory(
      addDays(today, -(STREAK_LOOKBACK_DAYS - 1)),
      today,
    )
    const yesterdayOverview = day(yesterday)
    return {
      streak: computeStreak(today, tasks, completions),
      yesterday: {
        date: yesterday,
        result: dayResult(yesterday, tasks, completions),
        done: yesterdayOverview.doneCount,
        total: yesterdayOverview.items.length,
      },
    }
  }
}

import type { Completion } from './completion'
import type { LocalDate } from './local-date'
import { isScheduledOn, type Task } from './task'

export interface DayItem {
  readonly task: Task
  /** `null` while the task is still pending. */
  readonly completedAt: Date | null
}

export interface DayOverview {
  readonly date: LocalDate
  /** In creation order — items don't jump around when toggled. */
  readonly items: readonly DayItem[]
  readonly doneCount: number
}

/** What the given day looks like: tasks scheduled on it and whether each is done. */
export function buildDayOverview(
  date: LocalDate,
  tasks: readonly Task[],
  completions: readonly Completion[],
): DayOverview {
  const completedAt = new Map(
    completions.filter((c) => c.date === date).map((c) => [c.taskId, c.completedAt]),
  )
  const items = tasks
    .filter((task) => isScheduledOn(task, date))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((task) => ({ task, completedAt: completedAt.get(task.id) ?? null }))

  return {
    date,
    items,
    doneCount: items.filter((item) => item.completedAt !== null).length,
  }
}

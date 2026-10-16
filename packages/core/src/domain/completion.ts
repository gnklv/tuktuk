import { parseLocalDate, type LocalDate } from './local-date'
import type { TaskId } from './task'

/** The fact that a task was done on a given day. Absence means "not done". */
export interface Completion {
  readonly taskId: TaskId
  readonly date: LocalDate
  readonly completedAt: Date
}

/** Rebuilds a completion from storage; throws on corrupted data. */
export function restoreCompletion(stored: {
  taskId: unknown
  date: unknown
  completedAt: Date
}): Completion {
  if (typeof stored.taskId !== 'string' || stored.taskId === '')
    throw new Error('completion taskId')
  if (Number.isNaN(stored.completedAt.getTime())) throw new Error('completion completedAt')
  return {
    taskId: stored.taskId as TaskId,
    date: parseLocalDate(String(stored.date)),
    completedAt: stored.completedAt,
  }
}

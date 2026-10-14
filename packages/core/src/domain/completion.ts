import type { LocalDate } from './local-date'
import type { TaskId } from './task'

/** The fact that a task was done on a given day. Absence means "not done". */
export interface Completion {
  readonly taskId: TaskId
  readonly date: LocalDate
  readonly completedAt: Date
}

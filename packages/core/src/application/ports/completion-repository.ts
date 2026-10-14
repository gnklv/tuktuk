import type { Completion } from '../../domain/completion'
import type { LocalDate } from '../../domain/local-date'
import type { TaskId } from '../../domain/task'

export interface CompletionRepository {
  getByDate(date: LocalDate): Promise<Completion[]>
  /** Inclusive range, for streaks and history. */
  getInRange(from: LocalDate, to: LocalDate): Promise<Completion[]>
  /** Inserts or replaces by (taskId, date). */
  save(completion: Completion): Promise<void>
  remove(taskId: TaskId, date: LocalDate): Promise<void>
}

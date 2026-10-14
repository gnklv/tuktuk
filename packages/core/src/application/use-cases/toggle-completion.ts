import type { LocalDate } from '../../domain/local-date'
import { isScheduledOn, type TaskId } from '../../domain/task'
import { DomainError } from '../../domain/shared/domain-error'
import type { Clock } from '../ports/clock'
import type { CompletionRepository } from '../ports/completion-repository'
import type { TaskRepository } from '../ports/task-repository'

/** Marks a task done on `date`, or un-marks it if it already was. Returns the new state. */
export const makeToggleCompletion =
  (deps: { taskRepo: TaskRepository; completionRepo: CompletionRepository; clock: Clock }) =>
  async (taskId: TaskId, date: LocalDate): Promise<{ done: boolean }> => {
    const task = await deps.taskRepo.getById(taskId)
    if (!task) throw new DomainError('task.notFound')
    if (!isScheduledOn(task, date)) throw new DomainError('task.notScheduled')

    const existing = (await deps.completionRepo.getByDate(date)).find((c) => c.taskId === taskId)
    if (existing) {
      await deps.completionRepo.remove(taskId, date)
      return { done: false }
    }
    await deps.completionRepo.save({ taskId, date, completedAt: deps.clock.now() })
    return { done: true }
  }

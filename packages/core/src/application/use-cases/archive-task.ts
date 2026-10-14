import type { LocalDate } from '../../domain/local-date'
import { archiveTask, type TaskId } from '../../domain/task'
import { DomainError } from '../../domain/shared/domain-error'
import type { TaskRepository } from '../ports/task-repository'

/** Removes a task from `today` on. Past days and completions are kept for history. */
export const makeArchiveTask =
  (deps: { taskRepo: TaskRepository }) =>
  async (taskId: TaskId, today: LocalDate): Promise<void> => {
    const task = await deps.taskRepo.getById(taskId)
    if (!task) throw new DomainError('task.notFound')
    await deps.taskRepo.save(archiveTask(task, today))
  }

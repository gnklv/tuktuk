import type { LocalDate } from '../../domain/local-date'
import { createTask, type NewTaskInput, type Task, type TaskId } from '../../domain/task'
import type { Clock } from '../ports/clock'
import type { IdGenerator } from '../ports/id-generator'
import type { TaskRepository } from '../ports/task-repository'

/** `today` is the current day in the user's timezone, as decided by the caller. */
export const makeAddTask =
  (deps: { taskRepo: TaskRepository; ids: IdGenerator; clock: Clock }) =>
  async (input: NewTaskInput, today: LocalDate): Promise<Task> => {
    const task = createTask(input, {
      id: deps.ids.next() as TaskId,
      now: deps.clock.now(),
      today,
    })
    await deps.taskRepo.save(task)
    return task
  }

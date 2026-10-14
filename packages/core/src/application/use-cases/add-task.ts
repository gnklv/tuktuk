import { createTask, type NewTaskInput, type Task, type TaskId } from '../../domain/task'
import type { Clock } from '../ports/clock'
import type { IdGenerator } from '../ports/id-generator'
import type { TaskRepository } from '../ports/task-repository'

export const makeAddTask =
  (deps: { taskRepo: TaskRepository; ids: IdGenerator; clock: Clock }) =>
  async (input: NewTaskInput): Promise<Task> => {
    const task = createTask(input, { id: deps.ids.next() as TaskId, now: deps.clock.now() })
    await deps.taskRepo.save(task)
    return task
  }

import type { Task, TaskId } from '../../domain/task'

export interface TaskRepository {
  /** All tasks, including archived ones. */
  getAll(): Promise<Task[]>
  getById(id: TaskId): Promise<Task | null>
  /** Inserts or replaces by id. */
  save(task: Task): Promise<void>
}

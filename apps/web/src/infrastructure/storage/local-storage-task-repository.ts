import {
  restoreTask,
  type Task,
  type TaskId,
  type TaskRepository,
  type TaskSchedule,
} from '@tuktuk/core'
import { STORAGE_KEYS, parseList, readJson, writeJson } from './json-storage'

interface TaskDto {
  id: string
  title: string
  schedule: TaskSchedule
  required: boolean
  createdAt: string
  activeFrom?: string // missing in data saved before habits existed
  archivedOn?: string
}

const toDto = (task: Task): TaskDto => ({
  id: task.id,
  title: task.title,
  schedule: task.schedule,
  required: task.required,
  createdAt: task.createdAt.toISOString(),
  activeFrom: task.activeFrom,
  ...(task.archivedOn && { archivedOn: task.archivedOn }),
})

const fromDto = (value: unknown): Task => {
  const dto = (value ?? {}) as Partial<TaskDto>
  const createdAt = typeof dto.createdAt === 'string' ? dto.createdAt : ''
  return restoreTask({
    id: dto.id,
    title: dto.title,
    schedule: dto.schedule,
    // Stored before `required` could be false: missing means required.
    required: dto.required ?? true,
    createdAt: new Date(createdAt),
    // Stored before habits existed: the UTC creation date is a close enough approximation.
    activeFrom: dto.activeFrom ?? createdAt.slice(0, 10),
    ...(dto.archivedOn !== undefined && { archivedOn: dto.archivedOn }),
  })
}

export class LocalStorageTaskRepository implements TaskRepository {
  private readonly key = STORAGE_KEYS.tasks

  constructor(private readonly storage: Storage) {}

  async getAll(): Promise<Task[]> {
    return parseList(readJson(this.storage, this.key), this.key, fromDto)
  }

  async getById(id: TaskId): Promise<Task | null> {
    return (await this.getAll()).find((task) => task.id === id) ?? null
  }

  async save(task: Task): Promise<void> {
    const others = (await this.getAll()).filter((t) => t.id !== task.id)
    writeJson(this.storage, this.key, [...others, task].map(toDto))
  }
}

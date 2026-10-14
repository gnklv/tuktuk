import type { LocalDate, Task, TaskId, TaskRepository, TaskSchedule } from '@tuktuk/core'
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
  const dto = value as TaskDto
  if (typeof dto.id !== 'string' || typeof dto.title !== 'string' || !dto.schedule) {
    throw new Error('invalid task')
  }
  return {
    id: dto.id as TaskId,
    title: dto.title,
    schedule: dto.schedule,
    required: dto.required !== false,
    createdAt: new Date(dto.createdAt),
    // Old data: the UTC creation date is a close enough approximation.
    activeFrom: (dto.activeFrom ?? dto.createdAt.slice(0, 10)) as LocalDate,
    ...(dto.archivedOn && { archivedOn: dto.archivedOn as LocalDate }),
  }
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

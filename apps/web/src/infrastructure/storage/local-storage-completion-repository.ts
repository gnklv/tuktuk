import {
  restoreCompletion,
  type Completion,
  type CompletionRepository,
  type LocalDate,
  type TaskId,
} from '@tuktuk/core'
import { STORAGE_KEYS, parseList, readJson, writeJson } from './json-storage'

interface CompletionDto {
  taskId: string
  date: string
  completedAt: string
}

const toDto = (c: Completion): CompletionDto => ({
  taskId: c.taskId,
  date: c.date,
  completedAt: c.completedAt.toISOString(),
})

const fromDto = (value: unknown): Completion => {
  const dto = (value ?? {}) as Partial<CompletionDto>
  return restoreCompletion({
    taskId: dto.taskId,
    date: dto.date,
    completedAt: new Date(typeof dto.completedAt === 'string' ? dto.completedAt : ''),
  })
}

export class LocalStorageCompletionRepository implements CompletionRepository {
  private readonly key = STORAGE_KEYS.completions

  constructor(private readonly storage: Storage) {}

  private all(): Completion[] {
    return parseList(readJson(this.storage, this.key), this.key, fromDto)
  }

  private write(completions: Completion[]): void {
    writeJson(this.storage, this.key, completions.map(toDto))
  }

  async getByDate(date: LocalDate): Promise<Completion[]> {
    return this.all().filter((c) => c.date === date)
  }

  async getInRange(from: LocalDate, to: LocalDate): Promise<Completion[]> {
    // ISO dates compare correctly as strings.
    return this.all().filter((c) => c.date >= from && c.date <= to)
  }

  async save(completion: Completion): Promise<void> {
    const others = this.all().filter(
      (c) => !(c.taskId === completion.taskId && c.date === completion.date),
    )
    this.write([...others, completion])
  }

  async remove(taskId: TaskId, date: LocalDate): Promise<void> {
    this.write(this.all().filter((c) => !(c.taskId === taskId && c.date === date)))
  }
}

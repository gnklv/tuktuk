// In-memory implementations of the ports, for tests (core and apps).
import type { Clock } from '../application/ports/clock'
import type { CompletionRepository } from '../application/ports/completion-repository'
import type { IdGenerator } from '../application/ports/id-generator'
import type { Notifier } from '../application/ports/notifier'
import type { NudgeLogEntry, NudgeLogRepository } from '../application/ports/nudge-log-repository'
import type { NudgeCopy, NudgeMessage, NudgeMood } from '../domain/nudge'
import type { SettingsRepository } from '../application/ports/settings-repository'
import type { TaskRepository } from '../application/ports/task-repository'
import type { Completion } from '../domain/completion'
import type { LocalDate } from '../domain/local-date'
import type { Settings } from '../domain/settings'
import type { Task, TaskId } from '../domain/task'

export class InMemoryTaskRepository implements TaskRepository {
  readonly tasks = new Map<TaskId, Task>()
  async getAll() {
    return [...this.tasks.values()]
  }
  async getById(id: TaskId) {
    return this.tasks.get(id) ?? null
  }
  async save(task: Task) {
    this.tasks.set(task.id, task)
  }
}

export class InMemoryCompletionRepository implements CompletionRepository {
  readonly completions: Completion[] = []
  async getByDate(date: LocalDate) {
    return this.completions.filter((c) => c.date === date)
  }
  async getInRange(from: LocalDate, to: LocalDate) {
    return this.completions.filter((c) => c.date >= from && c.date <= to)
  }
  async save(completion: Completion) {
    await this.remove(completion.taskId, completion.date)
    this.completions.push(completion)
  }
  async remove(taskId: TaskId, date: LocalDate) {
    const index = this.completions.findIndex((c) => c.taskId === taskId && c.date === date)
    if (index !== -1) this.completions.splice(index, 1)
  }
}

export class InMemorySettingsRepository implements SettingsRepository {
  constructor(public settings: Settings | null = null) {}
  async get() {
    return this.settings
  }
  async save(settings: Settings) {
    this.settings = settings
  }
}

/** A clock frozen at `iso` that can be moved manually. */
export function fakeClock(iso: string): Clock & { set(iso: string): void } {
  let now = new Date(iso)
  return {
    now: () => new Date(now),
    set: (next) => {
      now = new Date(next)
    },
  }
}

export function sequentialIds(prefix = 'id'): IdGenerator {
  let n = 0
  return { next: () => `${prefix}-${++n}` }
}

export class InMemoryNudgeLog implements NudgeLogRepository {
  constructor(public last: NudgeLogEntry | null = null) {}
  async getLast() {
    return this.last
  }
  async save(entry: NudgeLogEntry) {
    this.last = entry
  }
}

export class RecordingNotifier implements Notifier {
  readonly shown: NudgeMessage[] = []
  async show(message: NudgeMessage) {
    this.shown.push(message)
  }
}

/** Deterministic `random`: cycles through the given values. */
export function sequenceRandom(...values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length] ?? 0
}

/** Predictable wording: `[mood] #i {task} / {time}`, three variants per mood. */
export const fakeNudgeCopy: NudgeCopy = {
  title: (locale, mood: NudgeMood) => `${locale}:${mood}`,
  variants: (_, mood) => [0, 1, 2].map((i) => `[${mood}] #${i} {task} / {time}`),
  duration: (_, minutes) => `${minutes}m`,
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocalDate, Settings, TaskId, TimeOfDay } from '@tuktuk/core'
import { createTask } from '@tuktuk/core'
import { STORAGE_KEYS } from './json-storage'
import { LocalStorageTaskRepository } from './local-storage-task-repository'
import { LocalStorageCompletionRepository } from './local-storage-completion-repository'
import { LocalStorageSettingsRepository } from './local-storage-settings-repository'

/** Minimal in-memory `Storage`, so these tests don't need a DOM environment. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

const today = '2026-10-14' as LocalDate
let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('LocalStorageTaskRepository', () => {
  const task = createTask(
    { title: 'Call mom', schedule: { kind: 'once', date: today } },
    { id: 't1' as TaskId, now: new Date('2026-10-14T09:00:00Z'), today },
  )

  it('round-trips tasks including dates', async () => {
    const repo = new LocalStorageTaskRepository(storage)
    await repo.save(task)
    expect(await new LocalStorageTaskRepository(storage).getAll()).toEqual([task])
  })

  it('replaces a task with the same id', async () => {
    const repo = new LocalStorageTaskRepository(storage)
    await repo.save(task)
    await repo.save({ ...task, title: 'Call dad' })
    expect((await repo.getAll()).map((t) => t.title)).toEqual(['Call dad'])
  })

  it('reads tasks saved before activeFrom existed', async () => {
    storage.setItem(
      STORAGE_KEYS.tasks,
      JSON.stringify([
        {
          id: 'old',
          title: 'Old task',
          schedule: { kind: 'once', date: today },
          required: true,
          createdAt: '2026-10-13T21:30:00.000Z',
        },
      ]),
    )
    const [task] = await new LocalStorageTaskRepository(storage).getAll()
    expect(task?.activeFrom).toBe('2026-10-13')
  })

  it('survives corrupted storage', async () => {
    storage.setItem(STORAGE_KEYS.tasks, '{not json')
    expect(await new LocalStorageTaskRepository(storage).getAll()).toEqual([])

    storage.setItem(STORAGE_KEYS.tasks, JSON.stringify([{ garbage: true }]))
    expect(await new LocalStorageTaskRepository(storage).getAll()).toEqual([])
  })
})

describe('LocalStorageCompletionRepository', () => {
  const completion = {
    taskId: 't1' as TaskId,
    date: today,
    completedAt: new Date('2026-10-14T15:00:00Z'),
  }

  it('saves, reads by date and range, removes', async () => {
    const repo = new LocalStorageCompletionRepository(storage)
    await repo.save(completion)
    await repo.save(completion) // idempotent
    expect(await repo.getByDate(today)).toEqual([completion])
    expect(
      await repo.getInRange('2026-10-01' as LocalDate, '2026-10-31' as LocalDate),
    ).toHaveLength(1)
    expect(await repo.getByDate('2026-10-15' as LocalDate)).toEqual([])

    await repo.remove(completion.taskId, today)
    expect(await repo.getByDate(today)).toEqual([])
  })
})

describe('LocalStorageSettingsRepository', () => {
  const settings: Settings = {
    locale: 'ru',
    timeZone: 'Europe/Moscow',
    dayDeadline: 1380 as TimeOfDay,
    quietHours: { start: 1410 as TimeOfDay, end: 480 as TimeOfDay },
    theme: 'dark',
  }

  it('returns null before the first save, then round-trips', async () => {
    const repo = new LocalStorageSettingsRepository(storage)
    expect(await repo.get()).toBeNull()
    await repo.save(settings)
    expect(await repo.get()).toEqual(settings)
  })

  it('defaults the theme for settings saved before themes existed', async () => {
    const old: Record<string, unknown> = { ...settings }
    delete old.theme
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(old))
    expect((await new LocalStorageSettingsRepository(storage).get())?.theme).toBe('system')
  })

  it('ignores settings with an unsupported locale', async () => {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify({ ...settings, locale: 'de' }))
    expect(await new LocalStorageSettingsRepository(storage).get()).toBeNull()
  })
})

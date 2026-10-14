import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryCompletionRepository,
  InMemorySettingsRepository,
  InMemoryTaskRepository,
  fakeClock,
  sequentialIds,
} from '../../testing'
import type { LocalDate } from '../../domain/local-date'
import type { TaskId } from '../../domain/task'
import { makeAddTask } from './add-task'
import { makeGetDayOverview } from './get-day-overview'
import { makeToggleCompletion } from './toggle-completion'
import { makeGetSettings, makeUpdateSettings } from './settings'

const today = '2026-10-14' as LocalDate

describe('task use cases', () => {
  let taskRepo: InMemoryTaskRepository
  let completionRepo: InMemoryCompletionRepository
  let clock: ReturnType<typeof fakeClock>
  let addTask: ReturnType<typeof makeAddTask>
  let toggle: ReturnType<typeof makeToggleCompletion>
  let getDay: ReturnType<typeof makeGetDayOverview>

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository()
    completionRepo = new InMemoryCompletionRepository()
    clock = fakeClock('2026-10-14T09:00:00Z')
    addTask = makeAddTask({ taskRepo, ids: sequentialIds('task'), clock })
    toggle = makeToggleCompletion({ taskRepo, completionRepo, clock })
    getDay = makeGetDayOverview({ taskRepo, completionRepo })
  })

  it('adds a task and shows it in the day overview', async () => {
    const task = await addTask({ title: 'Call mom', schedule: { kind: 'once', date: today } })
    expect(task.id).toBe('task-1')

    const day = await getDay(today)
    expect(day.items.map((i) => i.task.title)).toEqual(['Call mom'])
    expect(day.doneCount).toBe(0)
  })

  it('does not save an invalid task', async () => {
    await expect(addTask({ title: ' ', schedule: { kind: 'once', date: today } })).rejects.toThrow(
      'task.titleEmpty',
    )
    expect(taskRepo.tasks.size).toBe(0)
  })

  it('toggles completion on and off', async () => {
    const task = await addTask({ title: 'Call mom', schedule: { kind: 'once', date: today } })

    clock.set('2026-10-14T15:00:00Z')
    expect(await toggle(task.id, today)).toEqual({ done: true })
    expect((await getDay(today)).items[0]?.completedAt).toEqual(new Date('2026-10-14T15:00:00Z'))

    expect(await toggle(task.id, today)).toEqual({ done: false })
    expect((await getDay(today)).doneCount).toBe(0)
  })

  it('refuses to complete unknown or unscheduled tasks', async () => {
    const task = await addTask({ title: 'Call mom', schedule: { kind: 'once', date: today } })
    await expect(toggle('nope' as TaskId, today)).rejects.toThrow('task.notFound')
    await expect(toggle(task.id, '2026-10-15' as LocalDate)).rejects.toThrow('task.notScheduled')
  })
})

describe('settings use cases', () => {
  const env = { locale: 'ru', timeZone: 'Europe/Moscow' } as const

  it('returns defaults from the environment on first launch without saving them', async () => {
    const settingsRepo = new InMemorySettingsRepository()
    const settings = await makeGetSettings({ settingsRepo })(env)
    expect(settings).toMatchObject({ locale: 'ru', timeZone: 'Europe/Moscow' })
    expect(settingsRepo.settings).toBeNull()
  })

  it('merges and persists updates', async () => {
    const settingsRepo = new InMemorySettingsRepository()
    const updated = await makeUpdateSettings({ settingsRepo })({ locale: 'en' }, env)
    expect(updated).toMatchObject({ locale: 'en', timeZone: 'Europe/Moscow' })
    expect(settingsRepo.settings).toEqual(updated)
  })
})

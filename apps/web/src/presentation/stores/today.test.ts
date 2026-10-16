import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import {
  createDefaultSettings,
  makeAddTask,
  makeArchiveTask,
  makeCheckNudge,
  makeGetReminderSnapshot,
  makeGetPendingTitles,
  makeGetStreak,
  makeGetDayOverview,
  makeToggleCompletion,
  makeUpdateSettings,
} from '@tuktuk/core'
import {
  InMemoryCompletionRepository,
  InMemoryNudgeLog,
  InMemorySettingsRepository,
  InMemoryTaskRepository,
  RecordingNotifier,
  fakeNudgeCopy,
  fakeClock,
  sequentialIds,
} from '@tuktuk/core/testing'
import { ClockKey, InitialSettingsKey, UseCasesKey, type AppUseCases } from '../di'
import { useTodayStore } from './today'

const env = { locale: 'ru', timeZone: 'Europe/Moscow' } as const

let app: App
let clock: ReturnType<typeof fakeClock>

beforeEach(() => {
  // 22:00 in Moscow (UTC+3)
  clock = fakeClock('2026-10-14T19:00:00Z')
  const taskRepo = new InMemoryTaskRepository()
  const completionRepo = new InMemoryCompletionRepository()
  const settingsRepo = new InMemorySettingsRepository()
  const useCases: AppUseCases = {
    addTask: makeAddTask({ taskRepo, ids: sequentialIds(), clock }),
    archiveTask: makeArchiveTask({ taskRepo }),
    toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
    getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
    updateSettings: (patch) => makeUpdateSettings({ settingsRepo })(patch, env),
    getReminderSnapshot: makeGetReminderSnapshot({ taskRepo, completionRepo }),
    getPendingTitles: makeGetPendingTitles({ taskRepo, completionRepo }),
    getStreak: makeGetStreak({ taskRepo, completionRepo }),
    // Not used by the today store.
    syncReminders: async () => 'unchanged',
    syncPush: async () => 'off',
    checkNudge: makeCheckNudge({
      clock,
      taskRepo,
      completionRepo,
      nudgeLog: new InMemoryNudgeLog(),
      notifier: new RecordingNotifier(),
      copy: fakeNudgeCopy,
      random: () => 0,
    }),
  }
  app = createApp({})
    .provide(ClockKey, clock)
    .provide(UseCasesKey, useCases)
    .provide(InitialSettingsKey, createDefaultSettings(env))
    .use(createPinia())
})

const useStore = () => app.runWithContext(() => useTodayStore())

describe('today store: day rollover', () => {
  it('switches to the new day after local midnight', async () => {
    const store = useStore()
    await store.load()
    await store.addTask({ title: 'Call mom', schedule: { kind: 'once', date: store.today() } })
    await store.addTask({ title: 'Stretch', schedule: { kind: 'weekly', weekdays: [3, 4] } })
    expect(store.date).toBe('2026-10-14')
    expect(store.total).toBe(2)

    // Still Wednesday in Moscow: nothing changes.
    clock.set('2026-10-14T20:59:00Z')
    await store.syncDay()
    expect(store.date).toBe('2026-10-14')

    // 00:30 Thursday in Moscow, although still Wednesday in UTC.
    clock.set('2026-10-14T21:30:00Z')
    await store.syncDay()
    expect(store.date).toBe('2026-10-15')
    // Yesterday's one-off is gone, the Thursday habit is there and not done.
    expect(store.overview?.items.map((i) => i.task.title)).toEqual(['Stretch'])
    expect(store.done).toBe(0)
  })

  it('does not tick off a task on a day that is already over', async () => {
    const store = useStore()
    await store.addTask({ title: 'Stretch', schedule: { kind: 'weekly', weekdays: [3, 4] } })
    const taskId = store.overview!.items[0]!.task.id

    clock.set('2026-10-14T21:30:00Z') // past midnight, list not refreshed yet
    await store.toggle(taskId)

    expect(store.date).toBe('2026-10-15')
    expect(store.done).toBe(0)
  })
})

describe('today store: pressure', () => {
  it('grows as time passes and drops to zero when everything is done', async () => {
    const store = useStore()
    // 22:00 in Moscow, deadline 23:00, active day 08:00–23:00
    await store.addTask({ title: 'Call mom', schedule: { kind: 'once', date: store.today() } })
    const evening = store.pressure.value
    expect(store.pressure.level).toBe('panic')

    clock.set('2026-10-14T19:50:00Z') // 22:50
    await store.tick()
    expect(store.pressure.value).toBeGreaterThan(evening)
    expect(store.pressure.minutesLeft).toBe(10)

    await store.toggle(store.overview!.items[0]!.task.id)
    expect(store.pressure.value).toBe(0)
  })
})

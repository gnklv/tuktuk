import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import {
  createDefaultSettings,
  makeAddTask,
  makeArchiveTask,
  makeCheckNudge,
  makeGetDayOverview,
  makeGetReminderSnapshot,
  makeGetPendingTitles,
  makeToggleCompletion,
  makeUpdateSettings,
  type LocalDate,
  type PendingTitles,
  type ReminderSnapshot,
} from '@tuktuk/core'
import {
  InMemoryCompletionRepository,
  InMemoryNudgeLog,
  InMemorySettingsRepository,
  InMemoryTaskRepository,
  RecordingNotifier,
  fakeClock,
  fakeNudgeCopy,
  sequentialIds,
} from '@tuktuk/core/testing'
import {
  ClockKey,
  InitialSettingsKey,
  NotificationsKey,
  PushKey,
  UseCasesKey,
  type AppUseCases,
  type PushAccess,
} from '../di'
import { useRemindersStore } from './reminders'

const env = { locale: 'ru', timeZone: 'Europe/Moscow' } as const
const today = '2026-10-17' as LocalDate

let app: App
let useCases: AppUseCases
let sent: ReminderSnapshot[]
let localTitles: PendingTitles[]

beforeEach(() => {
  vi.useFakeTimers()
  const clock = fakeClock('2026-10-17T09:00:00Z')
  const taskRepo = new InMemoryTaskRepository()
  const completionRepo = new InMemoryCompletionRepository()
  const settingsRepo = new InMemorySettingsRepository()
  useCases = {
    addTask: makeAddTask({ taskRepo, ids: sequentialIds(), clock }),
    archiveTask: makeArchiveTask({ taskRepo }),
    toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
    getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
    updateSettings: (patch) => makeUpdateSettings({ settingsRepo })(patch, env),
    getReminderSnapshot: makeGetReminderSnapshot({ taskRepo, completionRepo }),
    getPendingTitles: makeGetPendingTitles({ taskRepo, completionRepo }),
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
  sent = []
  localTitles = []
  const push: PushAccess = {
    status: async () => 'on',
    enable: async () => {},
    sendTest: async () => {},
    syncSnapshot: async (snapshot) => {
      sent.push(snapshot)
    },
    saveLocalTitles: async (titles) => {
      localTitles.push(titles)
    },
  }
  app = createApp({})
    .provide(ClockKey, clock)
    .provide(UseCasesKey, useCases)
    .provide(InitialSettingsKey, createDefaultSettings(env))
    .provide(NotificationsKey, {
      permission: () => 'granted',
      requestPermission: async () => 'granted',
      show: async () => {},
    })
    .provide(PushKey, push)
    .use(createPinia())
})

afterEach(() => vi.useRealTimers())

const useStore = () => app.runWithContext(() => useRemindersStore())

describe('reminders store: snapshot sync', () => {
  it('sends one snapshot for a burst of changes, and nothing if it did not change', async () => {
    const store = useStore()
    await store.syncPush() // push is on → schedules the first sync
    await useCases.addTask({ title: 'Secret', schedule: { kind: 'once', date: today } }, today)
    store.syncSnapshot()
    store.syncSnapshot()
    await vi.advanceTimersByTimeAsync(1000)

    expect(sent).toHaveLength(1)
    expect(sent[0]?.days[0]).toEqual({ date: today, total: 1, pending: 1 })
    expect(JSON.stringify(sent[0])).not.toContain('Secret')
    // …but the device keeps them for composing push texts.
    expect(localTitles.at(-1)?.[today]).toEqual(['Secret'])

    store.syncSnapshot() // nothing changed
    await vi.advanceTimersByTimeAsync(1000)
    expect(sent).toHaveLength(1)
  })
})

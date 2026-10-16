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
  makeGetStreak,
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
  LocalTitlesKey,
  NotificationsKey,
  PushKey,
  UseCasesKey,
  type AppUseCases,
} from '../di'
import type { PushAccess } from '../../application/ports'
import { useRemindersStore } from './reminders'

const env = { locale: 'ru', timeZone: 'Europe/Moscow' } as const
const today = '2026-10-17' as LocalDate

let app: App
let useCases: AppUseCases
let sent: ReminderSnapshot[]
let localTitles: PendingTitles[]
let notifier: RecordingNotifier
let pushOn: boolean

beforeEach(() => {
  vi.useFakeTimers()
  const clock = fakeClock('2026-10-17T09:00:00Z')
  const taskRepo = new InMemoryTaskRepository()
  const completionRepo = new InMemoryCompletionRepository()
  const settingsRepo = new InMemorySettingsRepository()
  notifier = new RecordingNotifier()
  pushOn = true
  useCases = {
    addTask: makeAddTask({ taskRepo, ids: sequentialIds(), clock }),
    archiveTask: makeArchiveTask({ taskRepo }),
    toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
    getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
    updateSettings: (patch) => makeUpdateSettings({ settingsRepo })(patch, env),
    getReminderSnapshot: makeGetReminderSnapshot({ taskRepo, completionRepo }),
    getPendingTitles: makeGetPendingTitles({ taskRepo, completionRepo }),
    getStreak: makeGetStreak({ taskRepo, completionRepo }),
    checkNudge: makeCheckNudge({
      clock,
      taskRepo,
      completionRepo,
      nudgeLog: new InMemoryNudgeLog(),
      notifier,
      copy: fakeNudgeCopy,
      random: () => 0,
    }),
  }
  sent = []
  localTitles = []
  const push: PushAccess = {
    status: async () => (pushOn ? 'on' : 'off'),
    enable: async () => {},
    sendTest: async () => {},
    syncSnapshot: async (snapshot) => {
      sent.push(snapshot)
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
    .provide(LocalTitlesKey, {
      save: async (titles) => {
        localTitles.push(titles)
      },
    })
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

  it('sends a pending change immediately when the app goes to the background', async () => {
    const store = useStore()
    await store.syncPush()
    await vi.advanceTimersByTimeAsync(1000)
    const before = sent.length

    await useCases.addTask({ title: 'Last minute', schedule: { kind: 'once', date: today } }, today)
    store.syncSnapshot()
    store.flushSnapshot() // the user locks the phone right away
    await vi.advanceTimersByTimeAsync(0)

    expect(sent).toHaveLength(before + 1)
    expect(sent.at(-1)?.days[0]).toEqual({ date: today, total: 1, pending: 1 })

    // Nothing pending → flushing again sends nothing.
    store.flushSnapshot()
    await vi.advanceTimersByTimeAsync(1000)
    expect(sent).toHaveLength(before + 1)
  })
})

describe('reminders store: delivery', () => {
  // 09:00 UTC = 12:00 in Moscow: a reminder is due (none sent yet today).
  const addTask = () =>
    useCases.addTask({ title: 'Call mom', schedule: { kind: 'once', date: today } }, today)

  it('with push on, the tab counts the reminder silently — the server delivers it', async () => {
    const store = useStore()
    await store.syncPush()
    await addTask()
    await store.check()
    expect(notifier.shown).toEqual([])
    expect(store.nextAt).not.toBeNull()
  })

  it('without push, the tab shows the notification itself', async () => {
    pushOn = false
    const store = useStore()
    store.permission = 'denied' // keeps syncPush from enabling push
    await store.syncPush()
    await addTask()
    await store.check()
    expect(notifier.shown).toHaveLength(1)
  })
})

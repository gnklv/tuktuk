import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import {
  createDefaultSettings,
  type LocalDate,
  type PendingTitles,
  type ReminderSnapshot,
} from '@tuktuk/core'
import { RecordingNotifier, fakeClock } from '@tuktuk/core/testing'
import {
  ClockKey,
  InitialSettingsKey,
  NotificationsKey,
  UseCasesKey,
  type AppUseCases,
} from '../di'
import { FakePush, createTestUseCases } from '../../testing/use-cases'
import { useRemindersStore } from './reminders'

const env = { locale: 'ru', timeZone: 'Europe/Moscow' } as const
const today = '2026-10-17' as LocalDate

let app: App
let useCases: AppUseCases
let sent: ReminderSnapshot[]
let localTitles: PendingTitles[]
let notifier: RecordingNotifier
let push: FakePush

beforeEach(() => {
  vi.useFakeTimers()
  const clock = fakeClock('2026-10-17T09:00:00Z')
  notifier = new RecordingNotifier()
  push = new FakePush('on')
  const created = createTestUseCases({ clock, notifier, push })
  useCases = created.useCases
  sent = push.snapshots
  localTitles = created.savedTitles
  app = createApp({})
    .provide(ClockKey, clock)
    .provide(UseCasesKey, useCases)
    .provide(InitialSettingsKey, createDefaultSettings(env))
    .provide(NotificationsKey, {
      permission: () => 'granted',
      requestPermission: async () => 'granted',
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
    push.current = 'off'
    const store = useStore()
    store.permission = 'denied' // keeps syncPush from enabling push
    await store.syncPush()
    await addTask()
    await store.check()
    expect(notifier.shown).toHaveLength(1)
  })
})

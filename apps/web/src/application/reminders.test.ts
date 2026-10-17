import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDefaultSettings,
  makeAddTask,
  makeGetPendingTitles,
  makeGetReminderSnapshot,
  type LocalDate,
  type PendingTitles,
  type ReminderSnapshot,
} from '@tuktuk/core'
import {
  InMemoryCompletionRepository,
  InMemoryTaskRepository,
  fakeClock,
  sequentialIds,
} from '@tuktuk/core/testing'
import { makeSyncPush, makeSyncReminders, tabDelivery } from './reminders'
import type { PushAccess, PushStatus } from './ports'

const settings = createDefaultSettings({ locale: 'ru', timeZone: 'Europe/Moscow' })
const today = '2026-10-17' as LocalDate

function fakePush(status: PushStatus = 'on') {
  const sent: ReminderSnapshot[] = []
  const push: PushAccess & { current: PushStatus } = {
    current: status,
    status: async () => push.current,
    enable: vi.fn(async () => {
      push.current = 'on'
    }),
    syncSnapshot: async (snapshot) => {
      sent.push(snapshot)
    },
  }
  return { push, sent }
}

describe('syncReminders', () => {
  let taskRepo: InMemoryTaskRepository
  let completionRepo: InMemoryCompletionRepository
  let order: string[]
  let saved: PendingTitles[]
  let sync: ReturnType<typeof makeSyncReminders>
  let sent: ReminderSnapshot[]

  beforeEach(() => {
    const clock = fakeClock('2026-10-17T09:00:00Z')
    taskRepo = new InMemoryTaskRepository()
    completionRepo = new InMemoryCompletionRepository()
    order = []
    saved = []
    const fake = fakePush()
    sent = fake.sent
    const syncSnapshot = fake.push.syncSnapshot
    fake.push.syncSnapshot = async (snapshot) => {
      order.push('snapshot')
      await syncSnapshot(snapshot)
    }
    sync = makeSyncReminders({
      clock,
      getPendingTitles: makeGetPendingTitles({ taskRepo, completionRepo }),
      getReminderSnapshot: makeGetReminderSnapshot({ taskRepo, completionRepo }),
      localTitles: {
        save: async (titles) => {
          order.push('titles')
          saved.push(titles)
        },
      },
      push: fake.push,
    })
    return makeAddTask({ taskRepo, ids: sequentialIds(), clock })(
      { title: 'Secret', schedule: { kind: 'once', date: today } },
      today,
    )
  })

  it('saves titles locally before sending counts to the server', async () => {
    expect(await sync(settings)).toBe('sent')
    expect(order).toEqual(['titles', 'snapshot'])
    expect(saved[0]?.[today]).toEqual(['Secret'])
    expect(sent[0]?.days[0]).toEqual({ date: today, total: 1, pending: 1 })
    expect(JSON.stringify(sent[0])).not.toContain('Secret')
  })

  it('does not resend an unchanged snapshot, but keeps titles fresh', async () => {
    await sync(settings)
    expect(await sync(settings)).toBe('unchanged')
    expect(sent).toHaveLength(1)
    expect(saved).toHaveLength(2)
  })

  it('resends after a change', async () => {
    await sync(settings)
    expect(await sync({ ...settings, locale: 'en' })).toBe('sent')
    expect(sent).toHaveLength(2)
  })
})

describe('syncPush', () => {
  it.each(['off', 'on'] as const)(
    'with notifications allowed, (re)enables push: status %s',
    async (status) => {
      const { push } = fakePush(status)
      expect(await makeSyncPush({ push })('granted')).toBe('on')
      expect(push.enable).toHaveBeenCalledOnce()
    },
  )

  it.each([
    ['default', 'off'],
    ['denied', 'off'],
    ['needs-install', 'unsupported'],
    ['granted', 'unsupported'],
  ] as const)('leaves push alone: permission %s, status %s', async (permission, status) => {
    const { push } = fakePush(status)
    expect(await makeSyncPush({ push })(permission)).toBe(status)
    expect(push.enable).not.toHaveBeenCalled()
  })
})

describe('tabDelivery', () => {
  it('is silent when push delivers or the user is looking, notify otherwise', () => {
    expect(tabDelivery('on', false)).toBe('silent')
    expect(tabDelivery('off', true)).toBe('silent')
    expect(tabDelivery('off', false)).toBe('notify')
    expect(tabDelivery('unsupported', false)).toBe('notify')
  })
})

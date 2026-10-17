import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { LocalDate, ReminderSnapshot } from '@tuktuk/core'
import { startLocalD1 } from '../testing/local-d1'
import {
  D1DeviceRepository,
  D1NudgeTargetRepository,
  D1SnapshotRepository,
  D1SubscriptionRepository,
} from './d1-repositories'

let d1: Awaited<ReturnType<typeof startLocalD1>>
let devices: D1DeviceRepository
let subscriptions: D1SubscriptionRepository
let snapshots: D1SnapshotRepository
let targets: D1NudgeTargetRepository

beforeAll(async () => {
  d1 = await startLocalD1()
  devices = new D1DeviceRepository(d1.db)
  subscriptions = new D1SubscriptionRepository(d1.db)
  snapshots = new D1SnapshotRepository(d1.db)
  targets = new D1NudgeTargetRepository(d1.db)
}, 30_000)

afterAll(() => d1.stop())
beforeEach(() => d1.reset())

const at = (iso: string) => new Date(iso)
const subscription = {
  endpoint: 'https://web.push.apple.com/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
}
const snapshot: ReminderSnapshot = {
  settings: {
    locale: 'ru',
    timeZone: 'Europe/Moscow',
    dayDeadline: 1380,
    quietHours: { start: 1410, end: 480 },
  } as ReminderSnapshot['settings'],
  days: [{ date: '2026-10-17' as LocalDate, total: 3, pending: 2 }],
}

async function device(id: string) {
  await devices.create({ id, tokenHash: `hash-${id}`, createdAt: at('2026-10-16T10:00:00Z') })
}

describe('D1DeviceRepository', () => {
  it('creates and finds a device', async () => {
    await device('d1')
    expect(await devices.findById('d1')).toEqual({
      id: 'd1',
      tokenHash: 'hash-d1',
      createdAt: at('2026-10-16T10:00:00Z'),
    })
    expect(await devices.findById('nope')).toBeNull()
  })

  it('deletes old devices without a subscription, keeps the rest', async () => {
    const old = at('2026-10-01T00:00:00Z')
    await devices.create({ id: 'old-abandoned', tokenHash: 'h', createdAt: old })
    await devices.create({ id: 'old-subscribed', tokenHash: 'h', createdAt: old })
    await subscriptions.save('old-subscribed', subscription, old)
    await devices.create({ id: 'fresh', tokenHash: 'h', createdAt: at('2026-10-16T00:00:00Z') })

    expect(await devices.deleteAbandoned(at('2026-10-10T00:00:00Z'))).toBe(1)
    expect(await devices.findById('old-abandoned')).toBeNull()
    expect(await devices.findById('old-subscribed')).not.toBeNull()
    expect(await devices.findById('fresh')).not.toBeNull()
  })

  it('rejects a duplicate id', async () => {
    await device('d1')
    await expect(device('d1')).rejects.toThrow()
  })
})

describe('D1SubscriptionRepository', () => {
  it('saves, replaces and removes the subscription of a device', async () => {
    await device('d1')
    await subscriptions.save('d1', subscription, at('2026-10-16T10:00:00Z'))
    expect(await subscriptions.get('d1')).toEqual(subscription)

    const renewed = { endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'p2', auth: 'a2' } }
    await subscriptions.save('d1', renewed, at('2026-10-17T10:00:00Z'))
    expect(await subscriptions.get('d1')).toEqual(renewed)

    await subscriptions.remove('d1')
    expect(await subscriptions.get('d1')).toBeNull()
  })

  it('belongs to an existing device (foreign key)', async () => {
    await expect(
      subscriptions.save('ghost', subscription, at('2026-10-16T10:00:00Z')),
    ).rejects.toThrow()
  })
})

describe('D1SnapshotRepository', () => {
  it('saves and replaces the snapshot, re-validating it on read', async () => {
    await device('d1')
    await snapshots.save('d1', snapshot, at('2026-10-16T10:00:00Z'))
    expect(await snapshots.get('d1')).toEqual(snapshot)

    const later = { ...snapshot, days: [{ date: '2026-10-18' as LocalDate, total: 1, pending: 1 }] }
    await snapshots.save('d1', later, at('2026-10-17T10:00:00Z'))
    expect(await snapshots.get('d1')).toEqual(later)

    // Stored data that no longer passes validation reads as missing.
    await d1.db.prepare(`UPDATE snapshots SET data = '{"days":"broken"}'`).run()
    expect(await snapshots.get('d1')).toBeNull()
  })
})

describe('D1NudgeTargetRepository', () => {
  it('lists only devices with both a subscription and a snapshot', async () => {
    await device('full')
    await subscriptions.save('full', subscription, at('2026-10-16T10:00:00Z'))
    await snapshots.save('full', snapshot, at('2026-10-16T10:00:00Z'))
    await device('no-snapshot')
    await subscriptions.save('no-snapshot', subscription, at('2026-10-16T10:00:00Z'))
    await device('no-subscription')
    await snapshots.save('no-subscription', snapshot, at('2026-10-16T10:00:00Z'))

    const active = await targets.listActive()
    expect(active.map((t) => t.deviceId)).toEqual(['full'])
    expect(active[0]).toEqual({ deviceId: 'full', subscription, snapshot, lastNudge: null })
  })

  it('records the last reminder and returns it with the target', async () => {
    await device('d1')
    await subscriptions.save('d1', subscription, at('2026-10-16T10:00:00Z'))
    await snapshots.save('d1', snapshot, at('2026-10-16T10:00:00Z'))

    await targets.recordNudge('d1', '2026-10-17' as LocalDate, at('2026-10-17T05:00:00Z'))
    await targets.recordNudge('d1', '2026-10-17' as LocalDate, at('2026-10-17T08:00:00Z'))

    const [target] = await targets.listActive()
    expect(target?.lastNudge).toEqual({ date: '2026-10-17', at: at('2026-10-17T08:00:00Z') })
  })

  it('skips devices whose stored snapshot no longer validates', async () => {
    await device('d1')
    await subscriptions.save('d1', subscription, at('2026-10-16T10:00:00Z'))
    await snapshots.save('d1', snapshot, at('2026-10-16T10:00:00Z'))
    await d1.db.prepare(`UPDATE snapshots SET data = '{}'`).run()
    expect(await targets.listActive()).toEqual([])
  })
})

describe('deleting a device', () => {
  it('cascades to its subscription, snapshot and reminder log', async () => {
    await device('d1')
    await subscriptions.save('d1', subscription, at('2026-10-16T10:00:00Z'))
    await snapshots.save('d1', snapshot, at('2026-10-16T10:00:00Z'))
    await targets.recordNudge('d1', '2026-10-17' as LocalDate, at('2026-10-17T05:00:00Z'))

    await d1.db.prepare(`DELETE FROM devices WHERE id = 'd1'`).run()

    for (const table of ['push_subscriptions', 'snapshots', 'nudge_log']) {
      const row = await d1.db.prepare(`SELECT count(*) AS n FROM ${table}`).first<{ n: number }>()
      expect(row?.n, table).toBe(0)
    }
  })
})

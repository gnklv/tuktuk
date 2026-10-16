import { beforeEach, describe, expect, it } from 'vitest'
import { fakeClock } from '@tuktuk/core/testing'
import { makeDeviceUseCases } from './devices'
import { InMemoryDevices, InMemorySnapshots, InMemorySubscriptions, fakeSecrets } from './fakes'

const subscription = {
  endpoint: 'https://web.push.apple.com/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
}

let devices: InMemoryDevices
let subscriptions: InMemorySubscriptions
let snapshots: InMemorySnapshots
let useCases: ReturnType<typeof makeDeviceUseCases>

beforeEach(() => {
  devices = new InMemoryDevices()
  subscriptions = new InMemorySubscriptions()
  snapshots = new InMemorySnapshots()
  useCases = makeDeviceUseCases({
    devices,
    subscriptions,
    snapshots,
    secrets: fakeSecrets,
    clock: fakeClock('2026-10-16T12:00:00Z'),
  })
})

describe('devices', () => {
  it('registers a device and stores only the token hash', async () => {
    const { deviceId, token } = await useCases.register()
    const stored = await devices.findById(deviceId)
    expect(stored?.tokenHash).toBe(`hash(${token})`)
    expect(JSON.stringify(stored)).not.toContain(`"${token}"`)
  })

  it('authenticates with the right token only', async () => {
    const { deviceId, token } = await useCases.register()
    expect(await useCases.authenticate(deviceId, token)).toBe(true)
    expect(await useCases.authenticate(deviceId, 'wrong')).toBe(false)
    expect(await useCases.authenticate('unknown', token)).toBe(false)
  })

  it('validates and saves a push subscription', async () => {
    const { deviceId } = await useCases.register()
    await useCases.saveSubscription(deviceId, { ...subscription, extra: 'ignored' })
    expect(await subscriptions.get(deviceId)).toEqual(subscription)

    for (const bad of [
      null,
      {},
      { ...subscription, endpoint: 'http://insecure' },
      { endpoint: subscription.endpoint },
    ]) {
      await expect(useCases.saveSubscription(deviceId, bad)).rejects.toThrow('invalid_subscription')
    }
  })

  it('saves a valid snapshot and rejects an invalid one', async () => {
    const { deviceId } = await useCases.register()
    const snapshot = {
      settings: { locale: 'en', timeZone: 'UTC', dayDeadline: 1380, quietHours: null },
      days: [{ date: '2026-10-16', total: 3, pending: 1 }],
    }
    await useCases.saveSnapshot(deviceId, snapshot)
    expect(await snapshots.get(deviceId)).toEqual(snapshot)

    await expect(
      useCases.saveSnapshot(deviceId, { ...snapshot, days: [{ date: 'x', total: 1, pending: 1 }] }),
    ).rejects.toThrow('invalid_snapshot')
  })
})

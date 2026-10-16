import { beforeEach, describe, expect, it } from 'vitest'
import {
  makeDeviceUseCases,
  InvalidSnapshotError,
  InvalidSubscriptionError,
  NoSubscriptionError,
} from './devices'
import {
  InMemoryDevices,
  InMemorySnapshots,
  InMemorySubscriptions,
  RecordingPushSender,
  fakeSecrets,
} from './fakes'

const subscription = {
  endpoint: 'https://web.push.apple.com/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
}

let devices: InMemoryDevices
let subscriptions: InMemorySubscriptions
let snapshots: InMemorySnapshots
let push: RecordingPushSender
let useCases: ReturnType<typeof makeDeviceUseCases>

beforeEach(() => {
  devices = new InMemoryDevices()
  subscriptions = new InMemorySubscriptions()
  snapshots = new InMemorySnapshots()
  push = new RecordingPushSender()
  useCases = makeDeviceUseCases({
    devices,
    subscriptions,
    snapshots,
    secrets: fakeSecrets,
    push,
    now: () => new Date('2026-10-16T12:00:00Z'),
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
    expect(await useCases.authenticate(`Bearer ${deviceId}.${token}`)).toBe(deviceId)
    expect(await useCases.authenticate(`Bearer ${deviceId}.wrong`)).toBeNull()
    expect(await useCases.authenticate(`Bearer unknown.${token}`)).toBeNull()
    expect(await useCases.authenticate('garbage')).toBeNull()
    expect(await useCases.authenticate(null)).toBeNull()
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
      await expect(useCases.saveSubscription(deviceId, bad)).rejects.toThrow(
        InvalidSubscriptionError,
      )
    }
  })

  it('sends a test push to the saved subscription', async () => {
    const { deviceId } = await useCases.register()
    await expect(useCases.sendTestPush(deviceId, 'ru')).rejects.toThrow(NoSubscriptionError)

    await useCases.saveSubscription(deviceId, subscription)
    expect(await useCases.sendTestPush(deviceId, 'ru')).toBe('sent')
    expect(push.sent).toEqual([{ subscription, payload: { type: 'test', locale: 'ru' } }])
  })

  it('forgets a subscription the push service no longer knows', async () => {
    const { deviceId } = await useCases.register()
    await useCases.saveSubscription(deviceId, subscription)
    push.result = 'gone'
    expect(await useCases.sendTestPush(deviceId, 'en')).toBe('gone')
    expect(await subscriptions.get(deviceId)).toBeNull()
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
    ).rejects.toThrow(InvalidSnapshotError)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { makeDeviceUseCases, DeviceError } from './devices'
import {
  InMemoryDevices,
  InMemorySnapshots,
  InMemorySubscriptions,
  ManualBackground,
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
let background: ManualBackground
let useCases: ReturnType<typeof makeDeviceUseCases>

beforeEach(() => {
  devices = new InMemoryDevices()
  subscriptions = new InMemorySubscriptions()
  snapshots = new InMemorySnapshots()
  push = new RecordingPushSender()
  background = new ManualBackground()
  useCases = makeDeviceUseCases({
    devices,
    subscriptions,
    snapshots,
    secrets: fakeSecrets,
    push,
    background,
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
      await expect(useCases.saveSubscription(deviceId, bad)).rejects.toThrow(DeviceError)
    }
  })

  it('sends a test push to the saved subscription', async () => {
    const { deviceId } = await useCases.register()
    await expect(useCases.requestTestPush(deviceId, { locale: 'ru' })).rejects.toThrow(
      'no_subscription',
    )

    await useCases.saveSubscription(deviceId, subscription)
    expect(await useCases.requestTestPush(deviceId, { locale: 'ru' })).toBe('sent')
    expect(push.sent).toEqual([{ subscription, payload: { type: 'test', locale: 'ru' } }])
  })

  it('forgets a subscription the push service no longer knows', async () => {
    const { deviceId } = await useCases.register()
    await useCases.saveSubscription(deviceId, subscription)
    push.result = 'gone'
    expect(await useCases.requestTestPush(deviceId, { locale: 'en' })).toBe('gone')
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
    ).rejects.toThrow('invalid_snapshot')
  })

  it('schedules a delayed test push and sends it later', async () => {
    const { deviceId } = await useCases.register()
    await useCases.saveSubscription(deviceId, subscription)

    expect(await useCases.requestTestPush(deviceId, { locale: 'ru', delaySeconds: 10 })).toBe(
      'scheduled',
    )
    expect(background.pending[0]?.delayMs).toBe(10_000)
    expect(push.sent).toHaveLength(0)

    await background.runAll()
    expect(push.sent[0]?.payload).toEqual({ type: 'test', locale: 'ru' })
  })

  it('validates the test push request and reports a missing subscription up front', async () => {
    const { deviceId } = await useCases.register()
    const code = (input: { locale: unknown; delaySeconds?: unknown }) =>
      useCases.requestTestPush(deviceId, input).catch((e: DeviceError) => e.code)

    expect(await code({ locale: 'de' })).toBe('invalid_locale')
    for (const delaySeconds of [-1, 21, 1.5, '10']) {
      expect(await code({ locale: 'en', delaySeconds })).toBe('invalid_delay')
    }
    expect(await code({ locale: 'en', delaySeconds: 5 })).toBe('no_subscription')
    expect(background.pending).toHaveLength(0)
  })
})

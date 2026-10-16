import { parseReminderSnapshot, type Locale } from '@tuktuk/core'
import type {
  DeviceRepository,
  PushResult,
  PushSender,
  PushSubscriptionData,
  Secrets,
  SnapshotRepository,
  SubscriptionRepository,
} from './ports'

export interface DevicesDeps {
  devices: DeviceRepository
  subscriptions: SubscriptionRepository
  snapshots: SnapshotRepository
  secrets: Secrets
  push: PushSender
  now: () => Date
}

export class InvalidSubscriptionError extends Error {}
export class NoSubscriptionError extends Error {}
export class InvalidSnapshotError extends Error {}

export function makeDeviceUseCases(deps: DevicesDeps) {
  return {
    /** A new installed copy of the app. The token is returned once and never stored. */
    async register(): Promise<{ deviceId: string; token: string }> {
      const deviceId = deps.secrets.newId()
      const token = deps.secrets.newToken()
      await deps.devices.create({
        id: deviceId,
        tokenHash: await deps.secrets.hash(token),
        createdAt: deps.now(),
      })
      return { deviceId, token }
    },

    /** `Bearer <deviceId>.<token>` → device id, or `null` if the credentials are wrong. */
    async authenticate(authorization: string | null): Promise<string | null> {
      const match = /^Bearer ([\w-]+)\.([\w-]+)$/.exec(authorization ?? '')
      if (!match) return null
      const [, deviceId, token] = match as unknown as [string, string, string]
      const device = await deps.devices.findById(deviceId)
      if (!device) return null
      return deps.secrets.equal(device.tokenHash, await deps.secrets.hash(token)) ? deviceId : null
    },

    async saveSubscription(deviceId: string, input: unknown): Promise<void> {
      await deps.subscriptions.save(deviceId, parseSubscription(input), deps.now())
    },

    removeSubscription: (deviceId: string) => deps.subscriptions.remove(deviceId),

    /** Replaces the device's reminder snapshot (settings and counts, no titles). */
    async saveSnapshot(deviceId: string, input: unknown): Promise<void> {
      const snapshot = parseReminderSnapshot(input)
      if (!snapshot) throw new InvalidSnapshotError()
      await deps.snapshots.save(deviceId, snapshot, deps.now())
    },

    /** Throws `NoSubscriptionError` if the device has no push subscription. */
    async ensureSubscription(deviceId: string): Promise<void> {
      if (!(await deps.subscriptions.get(deviceId))) throw new NoSubscriptionError()
    },

    /** Sends a test push. A subscription the push service has forgotten is cleaned up. */
    async sendTestPush(deviceId: string, locale: Locale): Promise<PushResult> {
      const subscription = await deps.subscriptions.get(deviceId)
      if (!subscription) throw new NoSubscriptionError()
      const result = await deps.push.send(subscription, { type: 'test', locale })
      if (result === 'gone') await deps.subscriptions.remove(deviceId)
      return result
    },
  }
}

export type DeviceUseCases = ReturnType<typeof makeDeviceUseCases>

function parseSubscription(input: unknown): PushSubscriptionData {
  const { endpoint, keys } = (input ?? {}) as Partial<PushSubscriptionData>
  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    endpoint.length > 2048 ||
    typeof keys?.p256dh !== 'string' ||
    typeof keys.auth !== 'string' ||
    keys.p256dh.length > 200 ||
    keys.auth.length > 100
  ) {
    throw new InvalidSubscriptionError()
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

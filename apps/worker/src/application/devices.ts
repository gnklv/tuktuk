import { parseReminderSnapshot, type Clock } from '@tuktuk/core'
import type {
  DeviceRepository,
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
  clock: Clock
}

/** Every way a device request can be rejected. The http layer maps codes to statuses. */
export type DeviceErrorCode = 'invalid_subscription' | 'invalid_snapshot'

export class DeviceError extends Error {
  constructor(readonly code: DeviceErrorCode) {
    super(code)
    this.name = 'DeviceError'
  }
}

export function makeDeviceUseCases(deps: DevicesDeps) {
  return {
    /** A new installed copy of the app. The token is returned once and never stored. */
    async register(): Promise<{ deviceId: string; token: string }> {
      const deviceId = deps.secrets.newId()
      const token = deps.secrets.newToken()
      await deps.devices.create({
        id: deviceId,
        tokenHash: await deps.secrets.hash(token),
        createdAt: deps.clock.now(),
      })
      return { deviceId, token }
    },

    /** Whether the token belongs to the device. */
    async authenticate(deviceId: string, token: string): Promise<boolean> {
      const device = await deps.devices.findById(deviceId)
      return device !== null && deps.secrets.equal(device.tokenHash, await deps.secrets.hash(token))
    },

    async saveSubscription(deviceId: string, input: unknown): Promise<void> {
      await deps.subscriptions.save(deviceId, parseSubscription(input), deps.clock.now())
    },

    removeSubscription: (deviceId: string) => deps.subscriptions.remove(deviceId),

    /** Replaces the device's reminder snapshot (settings and counts, no titles). */
    async saveSnapshot(deviceId: string, input: unknown): Promise<void> {
      const snapshot = parseReminderSnapshot(input)
      if (!snapshot) throw new DeviceError('invalid_snapshot')
      await deps.snapshots.save(deviceId, snapshot, deps.clock.now())
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
    throw new DeviceError('invalid_subscription')
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

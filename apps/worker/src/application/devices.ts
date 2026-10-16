import { isLocale, parseReminderSnapshot, type Locale } from '@tuktuk/core'
import type {
  BackgroundTasks,
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
  background: BackgroundTasks
  now: () => Date
}

/** Every way a device request can be rejected. The http layer maps codes to statuses. */
export type DeviceErrorCode =
  | 'invalid_subscription'
  | 'invalid_snapshot'
  | 'invalid_locale'
  | 'invalid_delay'
  | 'no_subscription'

export class DeviceError extends Error {
  constructor(readonly code: DeviceErrorCode) {
    super(code)
    this.name = 'DeviceError'
  }
}

/** Delayed test pushes let you lock the phone first. Workers finish deferred work within ~30 s. */
export const MAX_TEST_PUSH_DELAY_SECONDS = 20

export function makeDeviceUseCases(deps: DevicesDeps) {
  async function sendTestPush(deviceId: string, locale: Locale): Promise<PushResult> {
    const subscription = await deps.subscriptions.get(deviceId)
    if (!subscription) throw new DeviceError('no_subscription')
    const result = await deps.push.send(subscription, { type: 'test', locale })
    // A subscription the push service has forgotten is cleaned up.
    if (result === 'gone') await deps.subscriptions.remove(deviceId)
    return result
  }

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

    /** Whether the token belongs to the device. */
    async authenticate(deviceId: string, token: string): Promise<boolean> {
      const device = await deps.devices.findById(deviceId)
      return device !== null && deps.secrets.equal(device.tokenHash, await deps.secrets.hash(token))
    },

    async saveSubscription(deviceId: string, input: unknown): Promise<void> {
      await deps.subscriptions.save(deviceId, parseSubscription(input), deps.now())
    },

    removeSubscription: (deviceId: string) => deps.subscriptions.remove(deviceId),

    /** Replaces the device's reminder snapshot (settings and counts, no titles). */
    async saveSnapshot(deviceId: string, input: unknown): Promise<void> {
      const snapshot = parseReminderSnapshot(input)
      if (!snapshot) throw new DeviceError('invalid_snapshot')
      await deps.snapshots.save(deviceId, snapshot, deps.now())
    },

    /**
     * Sends a test push now, or schedules it after `delaySeconds` (so the phone can be locked
     * first). A missing subscription is reported right away, not lost in the background.
     */
    async requestTestPush(
      deviceId: string,
      input: { locale?: unknown; delaySeconds?: unknown },
    ): Promise<PushResult | 'scheduled'> {
      const { locale, delaySeconds = 0 } = input
      if (typeof locale !== 'string' || !isLocale(locale)) throw new DeviceError('invalid_locale')
      if (
        !Number.isInteger(delaySeconds) ||
        (delaySeconds as number) < 0 ||
        (delaySeconds as number) > MAX_TEST_PUSH_DELAY_SECONDS
      ) {
        throw new DeviceError('invalid_delay')
      }

      if (delaySeconds === 0) return sendTestPush(deviceId, locale)
      if (!(await deps.subscriptions.get(deviceId))) throw new DeviceError('no_subscription')
      deps.background.runLater((delaySeconds as number) * 1000, () =>
        sendTestPush(deviceId, locale),
      )
      return 'scheduled'
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

// In-memory implementations of the worker's ports, for tests.
import type {
  Device,
  DeviceRepository,
  NudgeTarget,
  NudgeTargetRepository,
  PushResult,
  PushSender,
  PushSubscriptionData,
  Secrets,
  SnapshotRepository,
  SubscriptionRepository,
} from '../application/ports'
import type { LocalDate, PushPayload, ReminderSnapshot } from '@tuktuk/core'

export class InMemoryDevices implements DeviceRepository {
  readonly all = new Map<string, Device>()
  async create(device: Device) {
    this.all.set(device.id, device)
  }
  async findById(id: string) {
    return this.all.get(id) ?? null
  }
  /** The fake knows no subscriptions: every old device counts as abandoned. */
  async deleteAbandoned(createdBefore: Date) {
    let deleted = 0
    for (const [id, device] of this.all) {
      if (device.createdAt < createdBefore) {
        this.all.delete(id)
        deleted++
      }
    }
    return deleted
  }
}

export class InMemorySubscriptions implements SubscriptionRepository {
  readonly all = new Map<string, PushSubscriptionData>()
  async save(deviceId: string, subscription: PushSubscriptionData) {
    this.all.set(deviceId, subscription)
  }
  async get(deviceId: string) {
    return this.all.get(deviceId) ?? null
  }
  async remove(deviceId: string) {
    this.all.delete(deviceId)
  }
}

export class InMemorySnapshots implements SnapshotRepository {
  readonly all = new Map<string, ReminderSnapshot>()
  async save(deviceId: string, snapshot: ReminderSnapshot) {
    this.all.set(deviceId, snapshot)
  }
  async get(deviceId: string) {
    return this.all.get(deviceId) ?? null
  }
}

export class InMemoryNudgeTargets implements NudgeTargetRepository {
  constructor(public targets: NudgeTarget[] = []) {}
  async listActive() {
    return this.targets
  }
  async recordNudge(deviceId: string, date: LocalDate, at: Date) {
    this.targets = this.targets.map((t) =>
      t.deviceId === deviceId ? { ...t, lastNudge: { date, at } } : t,
    )
  }
}

export class RecordingPushSender implements PushSender {
  readonly sent: { subscription: PushSubscriptionData; payload: PushPayload }[] = []
  constructor(public result: PushResult = 'sent') {}
  async send(subscription: PushSubscriptionData, payload: PushPayload) {
    this.sent.push({ subscription, payload })
    return this.result
  }
}

let counter = 0
export const fakeSecrets: Secrets = {
  newId: () => `device-${++counter}`,
  newToken: () => `token-${counter}`,
  hash: async (token) => `hash(${token})`,
  equal: (a, b) => a === b,
}

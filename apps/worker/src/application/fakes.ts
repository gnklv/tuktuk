// In-memory implementations of the worker's ports, for tests.
import type {
  Device,
  DeviceRepository,
  PushResult,
  PushSender,
  PushSubscriptionData,
  Secrets,
  SubscriptionRepository,
} from './ports'
import type { PushPayload } from '@tuktuk/core'

export class InMemoryDevices implements DeviceRepository {
  readonly all = new Map<string, Device>()
  async create(device: Device) {
    this.all.set(device.id, device)
  }
  async findById(id: string) {
    return this.all.get(id) ?? null
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

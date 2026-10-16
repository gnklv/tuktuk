import type { LocalDate, PushPayload, ReminderSnapshot } from '@tuktuk/core'

export interface Device {
  readonly id: string
  /** SHA-256 of the device's secret token. The token itself is never stored. */
  readonly tokenHash: string
  readonly createdAt: Date
}

export interface DeviceRepository {
  create(device: Device): Promise<void>
  findById(id: string): Promise<Device | null>
}

/** Subscription from `PushManager.subscribe()`, as the browser serializes it. */
export interface PushSubscriptionData {
  readonly endpoint: string
  readonly keys: { readonly p256dh: string; readonly auth: string }
}

export interface SubscriptionRepository {
  save(deviceId: string, subscription: PushSubscriptionData, now: Date): Promise<void>
  get(deviceId: string): Promise<PushSubscriptionData | null>
  remove(deviceId: string): Promise<void>
}

export interface Secrets {
  newId(): string
  /** A long random secret, URL-safe. */
  newToken(): string
  hash(token: string): Promise<string>
  /** Comparison that doesn't leak through timing. */
  equal(a: string, b: string): boolean
}

/** `gone`: the push service says the subscription no longer exists (app removed, permission revoked). */
export type PushResult = 'sent' | 'gone'

export interface PushSender {
  send(subscription: PushSubscriptionData, payload: PushPayload): Promise<PushResult>
}

export interface SnapshotRepository {
  save(deviceId: string, snapshot: ReminderSnapshot, now: Date): Promise<void>
  get(deviceId: string): Promise<ReminderSnapshot | null>
}

/** A device that may get reminders: it has a push subscription and a snapshot. */
export interface NudgeTarget {
  readonly deviceId: string
  readonly subscription: PushSubscriptionData
  readonly snapshot: ReminderSnapshot
  readonly lastNudge: { readonly date: LocalDate; readonly at: Date } | null
}

export interface NudgeTargetRepository {
  listActive(): Promise<NudgeTarget[]>
  recordNudge(deviceId: string, date: LocalDate, at: Date): Promise<void>
}

import { parseReminderSnapshot, type LocalDate, type ReminderSnapshot } from '@tuktuk/core'
import type {
  Device,
  DeviceRepository,
  NudgeTarget,
  NudgeTargetRepository,
  PushSubscriptionData,
  SnapshotRepository,
  SubscriptionRepository,
} from '../application/ports'

export class D1DeviceRepository implements DeviceRepository {
  constructor(private readonly db: D1Database) {}

  async create(device: Device): Promise<void> {
    const at = device.createdAt.toISOString()
    await this.db
      .prepare('INSERT INTO devices (id, token_hash, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .bind(device.id, device.tokenHash, at, at)
      .run()
  }

  async findById(id: string): Promise<Device | null> {
    const row = await this.db
      .prepare('SELECT id, token_hash, created_at FROM devices WHERE id = ?')
      .bind(id)
      .first<{ id: string; token_hash: string; created_at: string }>()
    return row
      ? { id: row.id, tokenHash: row.token_hash, createdAt: new Date(row.created_at) }
      : null
  }
}

export class D1SubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: D1Database) {}

  async save(deviceId: string, s: PushSubscriptionData, now: Date): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO push_subscriptions (device_id, endpoint, p256dh, auth, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (device_id) DO UPDATE SET
           endpoint = excluded.endpoint, p256dh = excluded.p256dh,
           auth = excluded.auth, updated_at = excluded.updated_at`,
      )
      .bind(deviceId, s.endpoint, s.keys.p256dh, s.keys.auth, now.toISOString())
      .run()
  }

  async get(deviceId: string): Promise<PushSubscriptionData | null> {
    const row = await this.db
      .prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE device_id = ?')
      .bind(deviceId)
      .first<{ endpoint: string; p256dh: string; auth: string }>()
    return row ? { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } } : null
  }

  async remove(deviceId: string): Promise<void> {
    await this.db.prepare('DELETE FROM push_subscriptions WHERE device_id = ?').bind(deviceId).run()
  }
}

export class D1SnapshotRepository implements SnapshotRepository {
  constructor(private readonly db: D1Database) {}

  async save(deviceId: string, snapshot: ReminderSnapshot, now: Date): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO snapshots (device_id, data, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (device_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      )
      .bind(deviceId, JSON.stringify(snapshot), now.toISOString())
      .run()
  }

  async get(deviceId: string): Promise<ReminderSnapshot | null> {
    const row = await this.db
      .prepare('SELECT data FROM snapshots WHERE device_id = ?')
      .bind(deviceId)
      .first<{ data: string }>()
    // Re-validated on read: stored data may predate a format change.
    return row ? parseReminderSnapshot(JSON.parse(row.data)) : null
  }
}

export class D1NudgeTargetRepository implements NudgeTargetRepository {
  constructor(private readonly db: D1Database) {}

  async listActive(): Promise<NudgeTarget[]> {
    const { results } = await this.db
      .prepare(
        `SELECT s.device_id, s.endpoint, s.p256dh, s.auth, sn.data, l.date, l.sent_at
         FROM push_subscriptions s
         JOIN snapshots sn ON sn.device_id = s.device_id
         LEFT JOIN nudge_log l ON l.device_id = s.device_id`,
      )
      .all<{
        device_id: string
        endpoint: string
        p256dh: string
        auth: string
        data: string
        date: string | null
        sent_at: string | null
      }>()

    return results.flatMap((row) => {
      const snapshot = parseReminderSnapshot(JSON.parse(row.data))
      if (!snapshot) return [] // stored in an older format: wait for the app to resend it
      return [
        {
          deviceId: row.device_id,
          subscription: { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          snapshot,
          lastNudge:
            row.date && row.sent_at
              ? { date: row.date as LocalDate, at: new Date(row.sent_at) }
              : null,
        },
      ]
    })
  }

  async recordNudge(deviceId: string, date: LocalDate, at: Date): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO nudge_log (device_id, date, sent_at) VALUES (?, ?, ?)
         ON CONFLICT (device_id) DO UPDATE SET date = excluded.date, sent_at = excluded.sent_at`,
      )
      .bind(deviceId, date, at.toISOString())
      .run()
  }
}

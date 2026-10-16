import type {
  Device,
  DeviceRepository,
  PushSubscriptionData,
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

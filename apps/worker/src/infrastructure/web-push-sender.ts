import { buildPushPayload, type VapidKeys } from '@block65/webcrypto-web-push'
import type { PushSender } from '../application/ports'

/** Encrypts the payload (RFC 8291), signs with VAPID (RFC 8292) and posts it to the push service. */
export class WebPushSender implements PushSender {
  constructor(private readonly vapid: VapidKeys) {}

  async send(...[subscription, payload]: Parameters<PushSender['send']>) {
    const request = await buildPushPayload(
      // Reminders are useless after a while: don't deliver a stale one hours later.
      { data: payload, options: { ttl: 15 * 60, urgency: 'high' } },
      { ...subscription, expirationTime: null },
      this.vapid,
    )
    const response = await fetch(subscription.endpoint, request)
    if (response.status === 404 || response.status === 410) return 'gone'
    if (!response.ok) {
      throw new Error(`push service responded ${response.status}: ${await response.text()}`)
    }
    return 'sent'
  }
}

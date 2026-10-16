import type { ReminderSnapshot } from '@tuktuk/core'
import type { PushAccess, PushStatus } from '../../application/ports'
import type { DeviceCredentialsStore } from './device-credentials-store'
import { ApiError, type DeviceCredentials, type PushServerClient } from './push-server-client'

/** The part of `ServiceWorkerRegistration` this service needs (easy to fake in tests). */
export interface PushRegistration {
  readonly pushManager: Pick<PushManager, 'getSubscription' | 'subscribe'>
}

/** The real one; `null` without a Service Worker (dev mode) or Web Push support. */
export async function browserPushRegistration(): Promise<PushRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

const base64UrlToBytes = (value: string) =>
  Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))

/**
 * Web Push for this device: registration on the push server and the browser's push
 * subscription. The server never learns task titles — only the endpoint, counts and settings.
 */
export class WebPushService implements PushAccess {
  constructor(
    private readonly deps: {
      credentials: DeviceCredentialsStore
      server: PushServerClient
      registration: () => Promise<PushRegistration | null>
    },
  ) {}

  async status(): Promise<PushStatus> {
    const registration = await this.deps.registration()
    if (!registration) return 'unsupported'
    const subscription = await registration.pushManager.getSubscription()
    return subscription && this.deps.credentials.get() ? 'on' : 'off'
  }

  /** Subscribes and tells the server. Requires notification permission to be granted. */
  async enable(): Promise<void> {
    const registration = await this.deps.registration()
    if (!registration) throw new Error('push is not supported')
    try {
      await this.subscribe(registration)
    } catch (error) {
      // The server doesn't know this device (e.g. the database was reset): register again.
      if (!(error instanceof ApiError && error.status === 401)) throw error
      this.deps.credentials.clear()
      await this.subscribe(registration)
    }
  }

  /** Settings and counts for the server's schedule. No-op until the device is registered. */
  async syncSnapshot(snapshot: ReminderSnapshot): Promise<void> {
    const credentials = this.deps.credentials.get()
    if (credentials) await this.deps.server.saveSnapshot(credentials, snapshot)
  }

  private async subscribe(registration: PushRegistration) {
    const credentials = await this.ensureDevice()
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(await this.deps.server.publicKey()),
      }))
    await this.deps.server.saveSubscription(credentials, subscription.toJSON())
  }

  private async ensureDevice(): Promise<DeviceCredentials> {
    const existing = this.deps.credentials.get()
    if (existing) return existing
    const created = await this.deps.server.registerDevice()
    this.deps.credentials.save(created)
    return created
  }
}

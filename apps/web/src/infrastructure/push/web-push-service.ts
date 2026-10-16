import type { Locale } from '@tuktuk/core'
import { ApiError, api } from './api-client'

export type PushStatus = 'unsupported' | 'off' | 'on'

interface DeviceCredentials {
  deviceId: string
  token: string
}

const CREDENTIALS_KEY = 'tuktuk:v1:device'

const base64UrlToBytes = (value: string) =>
  Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))

/**
 * Web Push subscription of this device on the push server. The server never learns task titles:
 * it gets only the browser's push endpoint (and, later, counts and settings).
 */
export class WebPushService {
  constructor(private readonly storage: Storage) {}

  async status(): Promise<PushStatus> {
    const registration = await this.registration()
    if (!registration) return 'unsupported'
    const subscription = await registration.pushManager.getSubscription()
    return subscription && this.credentials() ? 'on' : 'off'
  }

  /** Subscribes and tells the server. Requires notification permission to be granted. */
  async enable(): Promise<void> {
    const registration = await this.registration()
    if (!registration) throw new Error('push is not supported')
    try {
      await this.subscribe(registration)
    } catch (error) {
      // The server doesn't know this device (e.g. the database was reset): register again.
      if (!(error instanceof ApiError && error.status === 401)) throw error
      this.storage.removeItem(CREDENTIALS_KEY)
      await this.subscribe(registration)
    }
  }

  async sendTest(locale: Locale, delaySeconds: number): Promise<void> {
    await api('/devices/me/test-push', {
      method: 'POST',
      body: { locale, delaySeconds },
      auth: this.auth(await this.ensureDevice()),
    })
  }

  private async subscribe(registration: ServiceWorkerRegistration) {
    const credentials = await this.ensureDevice()
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(
          (await api<{ publicKey: string }>('/push/public-key')).publicKey,
        ),
      }))
    await api('/devices/me/push-subscription', {
      method: 'PUT',
      body: subscription.toJSON(),
      auth: this.auth(credentials),
    })
  }

  private async ensureDevice(): Promise<DeviceCredentials> {
    const existing = this.credentials()
    if (existing) return existing
    const created = await api<DeviceCredentials>('/devices', { method: 'POST' })
    this.storage.setItem(CREDENTIALS_KEY, JSON.stringify(created))
    return created
  }

  private credentials(): DeviceCredentials | null {
    try {
      const value = JSON.parse(
        this.storage.getItem(CREDENTIALS_KEY) ?? 'null',
      ) as DeviceCredentials | null
      return value?.deviceId && value.token ? value : null
    } catch {
      return null
    }
  }

  private auth = ({ deviceId, token }: DeviceCredentials) => `Bearer ${deviceId}.${token}`

  /** `null` without a Service Worker — e.g. in dev mode or a browser without Web Push. */
  private async registration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
    return (await navigator.serviceWorker.getRegistration()) ?? null
  }
}

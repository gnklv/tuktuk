import type { Locale, ReminderSnapshot } from '@tuktuk/core'

export interface DeviceCredentials {
  readonly deviceId: string
  readonly token: string
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API responded ${status}`)
  }
}

/** HTTP client of the push server (apps/worker). Knows the routes and the auth header format. */
export class PushServerClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {}

  async publicKey(): Promise<string> {
    return (await this.request<{ publicKey: string }>('GET', '/push/public-key')).publicKey
  }

  registerDevice(): Promise<DeviceCredentials> {
    return this.request('POST', '/devices')
  }

  saveSubscription(credentials: DeviceCredentials, subscription: PushSubscriptionJSON) {
    return this.request('PUT', '/devices/me/push-subscription', { credentials, body: subscription })
  }

  saveSnapshot(credentials: DeviceCredentials, snapshot: ReminderSnapshot) {
    // Often sent as the app goes to the background: keepalive lets it finish.
    return this.request('PUT', '/devices/me/snapshot', {
      credentials,
      body: snapshot,
      keepalive: true,
    })
  }

  sendTestPush(credentials: DeviceCredentials, locale: Locale, delaySeconds: number) {
    return this.request('POST', '/devices/me/test-push', {
      credentials,
      body: { locale, delaySeconds },
    })
  }

  private async request<T = void>(
    method: string,
    path: string,
    options: { credentials?: DeviceCredentials; body?: unknown; keepalive?: boolean } = {},
  ): Promise<T> {
    const { credentials, body, keepalive = false } = options
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      keepalive,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(credentials && {
          Authorization: `Bearer ${credentials.deviceId}.${credentials.token}`,
        }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
    if (!response.ok) throw new ApiError(response.status)
    return (response.status === 204 ? undefined : await response.json()) as T
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReminderSnapshot } from '@tuktuk/core'
import { WebPushService, type PushRegistration } from './web-push-service'
import { DeviceCredentialsStore } from './device-credentials-store'
import { ApiError, PushServerClient } from './push-server-client'

/** Minimal in-memory `Storage`. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

const subscriptionJson = {
  endpoint: 'https://web.push.apple.com/abc',
  keys: { p256dh: 'p', auth: 'a' },
}

function fakeRegistration(subscribed = false): PushRegistration & { subscribed: boolean } {
  const state = { subscribed }
  const subscription = { toJSON: () => subscriptionJson } as unknown as PushSubscription
  return {
    get subscribed() {
      return state.subscribed
    },
    pushManager: {
      getSubscription: async () => (state.subscribed ? subscription : null),
      subscribe: vi.fn(async () => {
        state.subscribed = true
        return subscription
      }),
    },
  }
}

/** A fake push server: answers like apps/worker and records requests. */
function fakeServer() {
  const requests: {
    method: string
    path: string
    auth: string | null
    body: unknown
    keepalive: boolean
  }[] = []
  let devices = 0
  let knownDevices = new Set<string>()
  const fetchFn = vi.fn(async (url: string | URL | Request, init: RequestInit = {}) => {
    const path = new URL(String(url)).pathname
    const headers = new Headers(init.headers)
    const auth = headers.get('Authorization')
    requests.push({
      method: init.method ?? 'GET',
      path,
      auth,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      keepalive: init.keepalive ?? false,
    })
    if (path === '/push/public-key') return Response.json({ publicKey: 'AQID' })
    if (path === '/devices') {
      const credentials = { deviceId: `d${++devices}`, token: 't' }
      knownDevices.add(credentials.deviceId)
      return Response.json(credentials, { status: 201 })
    }
    const deviceId = auth?.match(/^Bearer ([^.]+)\./)?.[1]
    if (!deviceId || !knownDevices.has(deviceId)) return new Response(null, { status: 401 })
    return new Response(null, { status: 204 })
  })
  return {
    requests,
    client: new PushServerClient('https://api.example', fetchFn as typeof fetch),
    forgetAllDevices: () => {
      knownDevices = new Set()
    },
  }
}

let storage: MemoryStorage
let credentials: DeviceCredentialsStore
let server: ReturnType<typeof fakeServer>

beforeEach(() => {
  storage = new MemoryStorage()
  credentials = new DeviceCredentialsStore(storage)
  server = fakeServer()
})

const service = (registration: PushRegistration | null) =>
  new WebPushService({ credentials, server: server.client, registration: async () => registration })

describe('WebPushService', () => {
  it('is unsupported without a Service Worker registration', async () => {
    expect(await service(null).status()).toBe('unsupported')
    await expect(service(null).enable()).rejects.toThrow('not supported')
  })

  it('enable: registers the device, subscribes and sends the subscription', async () => {
    const registration = fakeRegistration()
    const push = service(registration)
    expect(await push.status()).toBe('off')

    await push.enable()

    expect(await push.status()).toBe('on')
    expect(credentials.get()).toEqual({ deviceId: 'd1', token: 't' })
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 2, 3]),
    })
    expect(server.requests.at(-1)).toMatchObject({
      method: 'PUT',
      path: '/devices/me/push-subscription',
      auth: 'Bearer d1.t',
      body: subscriptionJson,
    })
  })

  it('reuses an existing subscription and device', async () => {
    credentials.save({ deviceId: 'd9', token: 'x' })
    const registration = fakeRegistration(true)
    server.forgetAllDevices()
    // d9 is unknown to the server → 401 → registers again and retries
    await service(registration).enable()
    expect(registration.pushManager.subscribe).not.toHaveBeenCalled()
    expect(credentials.get()?.deviceId).toBe('d1')
    expect(server.requests.filter((r) => r.path === '/devices')).toHaveLength(1)
  })

  it('syncSnapshot: no-op before registration, keepalive request after', async () => {
    const snapshot = { settings: {}, days: [] } as unknown as ReminderSnapshot
    const push = service(fakeRegistration())
    await push.syncSnapshot(snapshot)
    expect(server.requests).toHaveLength(0)

    await push.enable()
    await push.syncSnapshot(snapshot)
    expect(server.requests.at(-1)).toMatchObject({
      method: 'PUT',
      path: '/devices/me/snapshot',
      keepalive: true,
      body: snapshot,
    })
  })

  it('surfaces other server errors', async () => {
    const failing = new PushServerClient(
      'https://api.example',
      (async () => new Response(null, { status: 500 })) as typeof fetch,
    )
    const push = new WebPushService({
      credentials,
      server: failing,
      registration: async () => fakeRegistration(),
    })
    await expect(push.enable()).rejects.toThrow(ApiError)
  })
})

describe('DeviceCredentialsStore', () => {
  it('ignores missing or corrupted data', () => {
    expect(credentials.get()).toBeNull()
    storage.setItem('tuktuk:v1:device', '{oops')
    expect(credentials.get()).toBeNull()
    storage.setItem('tuktuk:v1:device', JSON.stringify({ deviceId: 1 }))
    expect(credentials.get()).toBeNull()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleRequest, type HttpDeps } from './router'
import { makeDeviceUseCases } from '../application/devices'
import {
  InMemoryDevices,
  InMemorySubscriptions,
  RecordingPushSender,
  fakeSecrets,
} from '../application/fakes'

let deps: HttpDeps
let push: RecordingPushSender

beforeEach(() => {
  push = new RecordingPushSender()
  deps = {
    allowedOrigins: 'https://gnklv.github.io,http://localhost:5180',
    vapidPublicKey: 'public-key',
    pingDatabase: async () => {},
    devices: makeDeviceUseCases({
      devices: new InMemoryDevices(),
      subscriptions: new InMemorySubscriptions(),
      secrets: fakeSecrets,
      push,
      now: () => new Date(),
    }),
  }
})

const call = (
  method: string,
  path: string,
  init: { body?: unknown; auth?: string; origin?: string } = {},
) =>
  handleRequest(
    new Request(`https://tuktuk.example${path}`, {
      method,
      headers: {
        ...(init.origin && { Origin: init.origin }),
        ...(init.auth && { Authorization: init.auth }),
        ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(init.body !== undefined && {
        body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
      }),
    }),
    deps,
  )

const register = async () => {
  const { deviceId, token } = (await (await call('POST', '/devices')).json()) as {
    deviceId: string
    token: string
  }
  return `Bearer ${deviceId}.${token}`
}

const subscription = { endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'p', auth: 'a' } }

describe('router', () => {
  it('GET /health checks the database', async () => {
    const pingDatabase = vi.fn(async () => {})
    deps.pingDatabase = pingDatabase
    const response = await call('GET', '/health')
    expect(await response.json()).toEqual({ ok: true })
    expect(pingDatabase).toHaveBeenCalled()
  })

  it('returns 500 without details when something breaks', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    deps.pingDatabase = async () => Promise.reject(new Error('db down'))
    const response = await call('GET', '/health')
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'internal' })
  })

  it('GET /push/public-key returns the VAPID key', async () => {
    expect(await (await call('GET', '/push/public-key')).json()).toEqual({
      publicKey: 'public-key',
    })
  })

  it('registers a device, saves a subscription and sends a test push', async () => {
    const auth = await register()
    expect(
      (await call('PUT', '/devices/me/push-subscription', { auth, body: subscription })).status,
    ).toBe(204)

    const response = await call('POST', '/devices/me/test-push', { auth, body: { locale: 'ru' } })
    expect(await response.json()).toEqual({ result: 'sent' })
    expect(push.sent[0]?.payload).toEqual({ type: 'test', locale: 'ru' })
  })

  it('rejects device routes without valid credentials', async () => {
    expect(
      (await call('PUT', '/devices/me/push-subscription', { body: subscription })).status,
    ).toBe(401)
    expect((await call('POST', '/devices/me/test-push', { auth: 'Bearer a.b' })).status).toBe(401)
  })

  it('maps bad input to 4xx', async () => {
    const auth = await register()
    expect(
      (await call('PUT', '/devices/me/push-subscription', { auth, body: '{oops' })).status,
    ).toBe(400)
    expect((await call('PUT', '/devices/me/push-subscription', { auth, body: {} })).status).toBe(
      400,
    )
    expect(
      (await call('POST', '/devices/me/test-push', { auth, body: { locale: 'de' } })).status,
    ).toBe(400)
    expect(
      (await call('POST', '/devices/me/test-push', { auth, body: { locale: 'en' } })).status,
    ).toBe(409)
  })

  it('reports a subscription the push service has forgotten', async () => {
    const auth = await register()
    await call('PUT', '/devices/me/push-subscription', { auth, body: subscription })
    push.result = 'gone'
    expect(
      (await call('POST', '/devices/me/test-push', { auth, body: { locale: 'en' } })).status,
    ).toBe(410)
  })

  it('returns 404 for unknown routes', async () => {
    expect((await call('GET', '/nope')).status).toBe(404)
  })

  it('allows CORS only for known origins and answers preflight', async () => {
    const allowed = await call('GET', '/health', { origin: 'https://gnklv.github.io' })
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('https://gnklv.github.io')
    const foreign = await call('GET', '/health', { origin: 'https://evil.example' })
    expect(foreign.headers.get('Access-Control-Allow-Origin')).toBeNull()
    const preflight = await call('OPTIONS', '/devices', { origin: 'http://localhost:5180' })
    expect(preflight.status).toBe(204)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleRequest, type HttpDeps } from './router'
import { makeDeviceUseCases } from '../application/devices'
import {
  InMemoryDevices,
  InMemorySnapshots,
  InMemorySubscriptions,
  fakeSecrets,
} from '../application/fakes'

let deps: HttpDeps

beforeEach(() => {
  deps = {
    allowedOrigins: 'https://gnklv.github.io,http://localhost:5180',
    vapidPublicKey: 'public-key',
    pingDatabase: async () => {},
    devices: makeDeviceUseCases({
      devices: new InMemoryDevices(),
      subscriptions: new InMemorySubscriptions(),
      snapshots: new InMemorySnapshots(),
      secrets: fakeSecrets,
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

  it('rejects device routes without valid credentials', async () => {
    const auth = await register()
    const [, deviceId] = /^Bearer ([^.]+)\./.exec(auth)!
    for (const header of [
      'garbage',
      `Bearer ${deviceId}`,
      `Bearer ${deviceId}.wrong`,
      'Bearer a.b.c',
    ]) {
      const response = await call('PUT', '/devices/me/snapshot', { auth: header, body: {} })
      expect(response.status, header).toBe(401)
    }
    expect(
      (await call('PUT', '/devices/me/push-subscription', { body: subscription })).status,
    ).toBe(401)
    expect(
      (await call('DELETE', '/devices/me/push-subscription', { auth: 'Bearer a.b' })).status,
    ).toBe(401)
  })

  it('maps bad input to 4xx', async () => {
    const auth = await register()
    expect(
      (await call('PUT', '/devices/me/push-subscription', { auth, body: '{oops' })).status,
    ).toBe(400)
    expect((await call('PUT', '/devices/me/push-subscription', { auth, body: {} })).status).toBe(
      400,
    )
  })

  it('PUT /devices/me/snapshot validates and stores the snapshot', async () => {
    const auth = await register()
    const snapshot = {
      settings: { locale: 'ru', timeZone: 'Europe/Moscow', dayDeadline: 1380, quietHours: null },
      days: [{ date: '2026-10-17', total: 2, pending: 2 }],
    }
    expect((await call('PUT', '/devices/me/snapshot', { auth, body: snapshot })).status).toBe(204)
    expect((await call('PUT', '/devices/me/snapshot', { auth, body: { days: 'x' } })).status).toBe(
      400,
    )
    expect((await call('PUT', '/devices/me/snapshot', { body: snapshot })).status).toBe(401)
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

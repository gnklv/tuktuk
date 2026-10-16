import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDate, PushPayload } from '@tuktuk/core'
import { WebPushSender } from './web-push-sender'
import { toBase64Url } from './base64url'

/** Real keys, as a browser and the server would have them. */
async function keys() {
  const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
  ])
  const browser = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])
  return {
    vapid: {
      subject: 'https://gnklv.github.io/tuktuk/',
      publicKey: toBase64Url(await crypto.subtle.exportKey('raw', vapid.publicKey)),
      privateKey: (await crypto.subtle.exportKey('jwk', vapid.privateKey)).d!,
    },
    subscription: {
      endpoint: 'https://web.push.apple.com/QGuQyavXutnMH',
      keys: {
        p256dh: toBase64Url(await crypto.subtle.exportKey('raw', browser.publicKey)),
        auth: toBase64Url(crypto.getRandomValues(new Uint8Array(16))),
      },
    },
  }
}

const nudge: PushPayload = {
  type: 'nudge',
  locale: 'ru',
  date: '2026-10-17' as LocalDate,
  pressure: { value: 0.5, level: 'insistent', elapsed: 0.7, minutesLeft: 120, overdue: false },
}

afterEach(() => vi.unstubAllGlobals())

describe('WebPushSender', () => {
  it('sends an encrypted, VAPID-signed request to the subscription endpoint', async () => {
    const { vapid, subscription } = await keys()
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await new WebPushSender(vapid).send(subscription, nudge)).toBe('sent')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(url).toBe(subscription.endpoint)
    expect(headers.get('content-encoding')).toBe('aes128gcm')
    expect(headers.get('authorization')).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/)
    expect(headers.get('ttl')).toBe('900')
    // The payload is encrypted: the plaintext must not be visible.
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).not.toContain('"nudge"')
  })

  it('maps 404 and 410 to gone, other errors to an exception', async () => {
    const { vapid, subscription } = await keys()
    const sender = new WebPushSender(vapid)

    vi.stubGlobal('fetch', async () => new Response(null, { status: 410 }))
    expect(await sender.send(subscription, nudge)).toBe('gone')

    vi.stubGlobal('fetch', async () => new Response('rate limited', { status: 429 }))
    await expect(sender.send(subscription, nudge)).rejects.toThrow('429')
  })
})

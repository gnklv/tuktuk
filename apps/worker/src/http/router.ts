import { isLocale } from '@tuktuk/core'
import {
  InvalidSubscriptionError,
  NoSubscriptionError,
  type DeviceUseCases,
} from '../application/devices'
import { corsHeaders, withCors } from './cors'
import { json, notFound } from './json'

/** What HTTP handlers need from the outside world. Wired in `index.ts`. */
export interface HttpDeps {
  allowedOrigins: string
  vapidPublicKey: string
  /** Throws if the database is unreachable. */
  pingDatabase(): Promise<void>
  devices: DeviceUseCases
}

export async function handleRequest(request: Request, deps: HttpDeps): Promise<Response> {
  const cors = corsHeaders(request, deps.allowedOrigins)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  let response: Response
  try {
    response = await route(request, deps)
  } catch (error) {
    response = toErrorResponse(error)
  }
  return withCors(response, cors)
}

async function route(request: Request, deps: HttpDeps): Promise<Response> {
  const { method } = request
  const { pathname: path } = new URL(request.url)

  if (method === 'GET' && path === '/health') {
    await deps.pingDatabase()
    return json({ ok: true })
  }
  if (method === 'GET' && path === '/push/public-key') {
    return json({ publicKey: deps.vapidPublicKey })
  }
  if (method === 'POST' && path === '/devices') {
    return json(await deps.devices.register(), 201)
  }

  if (path.startsWith('/devices/me/')) {
    const deviceId = await deps.devices.authenticate(request.headers.get('Authorization'))
    if (!deviceId) return json({ error: 'unauthorized' }, 401)

    if (path === '/devices/me/push-subscription' && method === 'PUT') {
      await deps.devices.saveSubscription(deviceId, await readJson(request))
      return new Response(null, { status: 204 })
    }
    if (path === '/devices/me/push-subscription' && method === 'DELETE') {
      await deps.devices.removeSubscription(deviceId)
      return new Response(null, { status: 204 })
    }
    if (path === '/devices/me/test-push' && method === 'POST') {
      const { locale } = ((await readJson(request)) ?? {}) as { locale?: unknown }
      if (typeof locale !== 'string' || !isLocale(locale)) {
        return json({ error: 'invalid_locale' }, 400)
      }
      const result = await deps.devices.sendTestPush(deviceId, locale)
      return result === 'gone' ? json({ error: 'subscription_gone' }, 410) : json({ result })
    }
  }

  return notFound()
}

class InvalidJsonError extends Error {}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new InvalidJsonError()
  }
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof InvalidJsonError) return json({ error: 'invalid_json' }, 400)
  if (error instanceof InvalidSubscriptionError) return json({ error: 'invalid_subscription' }, 400)
  if (error instanceof NoSubscriptionError) return json({ error: 'no_subscription' }, 409)
  console.error('[http] unhandled error', error)
  return json({ error: 'internal' }, 500)
}

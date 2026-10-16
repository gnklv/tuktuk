import { DeviceError, type DeviceErrorCode, type DeviceUseCases } from '../application/devices'
import { parseBearer } from './auth'
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

const STATUS: Record<DeviceErrorCode, number> = {
  invalid_subscription: 400,
  invalid_snapshot: 400,
  invalid_locale: 400,
  invalid_delay: 400,
  no_subscription: 409,
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
    const credentials = parseBearer(request.headers.get('Authorization'))
    if (
      !credentials ||
      !(await deps.devices.authenticate(credentials.deviceId, credentials.token))
    ) {
      return json({ error: 'unauthorized' }, 401)
    }
    const { deviceId } = credentials

    if (path === '/devices/me/push-subscription' && method === 'PUT') {
      await deps.devices.saveSubscription(deviceId, await readJson(request))
      return noContent()
    }
    if (path === '/devices/me/push-subscription' && method === 'DELETE') {
      await deps.devices.removeSubscription(deviceId)
      return noContent()
    }
    if (path === '/devices/me/snapshot' && method === 'PUT') {
      await deps.devices.saveSnapshot(deviceId, await readJson(request))
      return noContent()
    }
    if (path === '/devices/me/test-push' && method === 'POST') {
      const body = ((await readJson(request)) ?? {}) as { locale?: unknown; delaySeconds?: unknown }
      const result = await deps.devices.requestTestPush(deviceId, body)
      if (result === 'gone') return json({ error: 'subscription_gone' }, 410)
      return json({ result }, result === 'scheduled' ? 202 : 200)
    }
  }

  return notFound()
}

const noContent = () => new Response(null, { status: 204 })

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
  if (error instanceof DeviceError) return json({ error: error.code }, STATUS[error.code])
  console.error('[http] unhandled error', error)
  return json({ error: 'internal' }, 500)
}

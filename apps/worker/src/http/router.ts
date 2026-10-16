import { corsHeaders, withCors } from './cors'
import { json, notFound } from './json'

/** What HTTP handlers need from the outside world. Wired in `index.ts`. */
export interface HttpDeps {
  allowedOrigins: string
  /** Throws if the database is unreachable. */
  pingDatabase(): Promise<void>
}

export async function handleRequest(request: Request, deps: HttpDeps): Promise<Response> {
  const cors = corsHeaders(request, deps.allowedOrigins)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  const { pathname } = new URL(request.url)
  let response: Response
  try {
    response = await route(request.method, pathname, deps)
  } catch (error) {
    console.error('[http] unhandled error', error)
    response = json({ error: 'internal' }, 500)
  }
  return withCors(response, cors)
}

async function route(method: string, path: string, deps: HttpDeps): Promise<Response> {
  if (method === 'GET' && path === '/health') {
    await deps.pingDatabase()
    return json({ ok: true })
  }
  return notFound()
}

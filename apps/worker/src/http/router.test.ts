import { describe, expect, it, vi } from 'vitest'
import { handleRequest, type HttpDeps } from './router'

const deps = (patch: Partial<HttpDeps> = {}): HttpDeps => ({
  allowedOrigins: 'https://gnklv.github.io,http://localhost:5180',
  pingDatabase: async () => {},
  ...patch,
})

const get = (path: string, origin?: string) =>
  new Request(`https://tuktuk.example${path}`, { headers: origin ? { Origin: origin } : {} })

describe('router', () => {
  it('GET /health checks the database', async () => {
    const pingDatabase = vi.fn(async () => {})
    const response = await handleRequest(get('/health'), deps({ pingDatabase }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(pingDatabase).toHaveBeenCalled()
  })

  it('returns 500 without details when something breaks', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleRequest(
      get('/health'),
      deps({ pingDatabase: async () => Promise.reject(new Error('db down')) }),
    )
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'internal' })
  })

  it('returns 404 for unknown routes', async () => {
    expect((await handleRequest(get('/nope'), deps())).status).toBe(404)
  })

  it('allows CORS only for known origins', async () => {
    const allowed = await handleRequest(get('/health', 'https://gnklv.github.io'), deps())
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('https://gnklv.github.io')

    const foreign = await handleRequest(get('/health', 'https://evil.example'), deps())
    expect(foreign.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('answers CORS preflight', async () => {
    const preflight = new Request('https://tuktuk.example/health', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5180' },
    })
    const response = await handleRequest(preflight, deps())
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})

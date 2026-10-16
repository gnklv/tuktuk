/** CORS for the PWA: only origins listed in `ALLOWED_ORIGINS` may call the API from a browser. */
export function corsHeaders(request: Request, allowedOrigins: string): Headers {
  const headers = new Headers({ Vary: 'Origin' })
  const origin = request.headers.get('Origin')
  const allowed = allowedOrigins.split(',').map((o) => o.trim())
  if (origin && allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Max-Age', '86400')
  }
  return headers
}

export function withCors(response: Response, cors: Headers): Response {
  const result = new Response(response.body, response)
  cors.forEach((value, key) => result.headers.set(key, value))
  return result
}

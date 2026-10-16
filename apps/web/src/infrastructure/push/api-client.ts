/** Push server URL: production by default, a local `wrangler dev` in development. */
export const API_URL: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8787' : 'https://tuktuk.tuktuk-worker.workers.dev')

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API responded ${status}`)
  }
}

export async function api<T = void>(
  path: string,
  init: {
    method?: string
    body?: unknown
    auth?: string
    /** Lets the request finish even if the page is hidden or closed right after it starts. */
    keepalive?: boolean
  } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    keepalive: init.keepalive ?? false,
    headers: {
      ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(init.auth && { Authorization: init.auth }),
    },
    ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
  })
  if (!response.ok) throw new ApiError(response.status)
  return (response.status === 204 ? undefined : await response.json()) as T
}

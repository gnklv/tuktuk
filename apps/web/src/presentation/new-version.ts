import type { Router } from 'vue-router'

/**
 * After a deploy, the Service Worker activates the new version and drops the old files, while
 * an open page still runs the old code. Its next lazy import asks for an old chunk that no longer
 * exists. The fix: reload once onto the new version.
 */

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

export function isChunkLoadError(error: unknown): boolean {
  return CHUNK_ERROR.test(error instanceof Error ? error.message : String(error))
}

const LAST_RELOAD_KEY = 'tuktuk:new-version-reload-at'
/** A reload this recent means the reload didn't help: something else is broken, don't loop. */
const LOOP_GUARD_MS = 10_000

export interface ReloadDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'>
  now: () => number
  navigate: (url: string) => void
}

/** Reloads onto `url` with the new version. Returns `false` if it just did and gave up. */
export function reloadForNewVersion(deps: ReloadDeps, url: string): boolean {
  const last = Number(deps.storage.getItem(LAST_RELOAD_KEY))
  if (last && deps.now() - last < LOOP_GUARD_MS) return false
  deps.storage.setItem(LAST_RELOAD_KEY, String(deps.now()))
  deps.navigate(url)
  return true
}

/**
 * Wires recovery from stale chunks. Only route loads are dynamic imports in this app; a failed
 * Vite preload rethrows into the import, so the router sees it too — and, unlike a
 * `vite:preloadError` listener, it knows where the user was going.
 */
export function installNewVersionRecovery(router: Router) {
  const deps: ReloadDeps = {
    storage: sessionStorage,
    now: Date.now,
    navigate: (url) => window.location.assign(url),
  }

  router.onError((error, to) => {
    if (isChunkLoadError(error)) reloadForNewVersion(deps, router.resolve(to).href)
  })
}

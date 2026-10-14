import type { Clock } from '@tuktuk/core'

const OFFSET_KEY = 'tuktuk:dev:clock-offset'

/**
 * Dev-only clock that can be shifted to test day rollover, pressure, etc.
 * From the browser console:
 *   tuktukDev.setNow('2026-10-14T23:59:50')  // local time; page reloads
 *   tuktukDev.shift(60 * 60_000)             // +1 hour, no reload: wait for the next check
 *   tuktukDev.reset()
 * The offset survives reloads within the tab (sessionStorage).
 */
export function createDevClock(storage: Storage = sessionStorage): Clock {
  let offset = Number(storage.getItem(OFFSET_KEY)) || 0
  const save = () => storage.setItem(OFFSET_KEY, String(offset))

  const api = {
    setNow(iso: string) {
      offset = new Date(iso).getTime() - Date.now()
      save()
      location.reload()
    },
    shift(ms: number) {
      offset += ms
      save()
      return new Date(Date.now() + offset).toString()
    },
    reset() {
      storage.removeItem(OFFSET_KEY)
      location.reload()
    },
  }
  Object.assign(window, { tuktukDev: api })

  if (offset !== 0) {
    console.info(`[dev-clock] time is shifted: ${new Date(Date.now() + offset).toString()}`)
  }
  return { now: () => new Date(Date.now() + offset) }
}

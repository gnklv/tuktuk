import { describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadForNewVersion, type ReloadDeps } from './new-version'

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/tuktuk/assets/SettingsPage-1a2b.js', // Chrome
    'Importing a module script failed.', // Safari
    'error loading dynamically imported module: https://x/assets/a.js', // Firefox
    'Unable to preload CSS for /assets/SettingsPage-1a2b.css', // Vite
  ])('recognizes %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true)
  })

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('task.notFound'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('reloadForNewVersion', () => {
  const deps = (now: number) => {
    const store = new Map<string, string>()
    const navigate = vi.fn()
    const value: ReloadDeps = {
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => void store.set(k, v),
      },
      now: () => now,
      navigate,
    }
    return { value, navigate, store }
  }

  it('reloads onto the requested page', () => {
    const { value, navigate } = deps(1_000_000)
    expect(reloadForNewVersion(value, '/tuktuk/settings')).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/tuktuk/settings')
  })

  it('does not loop if the reload just happened, but tries again later', () => {
    const first = deps(1_000_000)
    reloadForNewVersion(first.value, '/tuktuk/settings')

    const soon = { ...first.value, now: () => 1_005_000 }
    expect(reloadForNewVersion(soon, '/tuktuk/settings')).toBe(false)

    const later = { ...first.value, now: () => 1_020_000 }
    expect(reloadForNewVersion(later, '/tuktuk/settings')).toBe(true)
    expect(first.navigate).toHaveBeenCalledTimes(2)
  })
})
